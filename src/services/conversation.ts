import httpStatus from "http-status";
import mongoose from "mongoose";
import {
  ASSISTANT_DEFAULT_MESSAGE,
  CONTACT_CAPTURE_MESSAGES,
  PROFESSIONAL_REPLY_LIMIT,
} from "../config/assistant";
import db from "../models";
import ApiError from "../utils/ApiError";
import { IntentCategory } from "../types";
import { classifyIntentWithGemini, generateChatResponse } from "./gemini";
import { addUniqueTags, mapIntentToTags } from "./tagManager";
import { detectProducerBranch, detectSelfIdentification, routeMessageByKeyword } from "./keywordRouter";
import { getFlowReply, getReplyLimitForFlow } from "./flowEngine";
import {
  buildAssistantMessage,
  buildUserMessage,
  shouldCompleteAfterReply,
  shouldWaitForContact,
} from "./responseGenerator";

type StartConversationInput = {
  userId?: string;
};

type SendMessageInput = {
  conversationId?: string;
  userId?: string;
  message: string;
};

const emailRegex = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
const phoneRegex =
  /(?:(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{3}\)?[\s-]?)\d{3}[\s-]?\d{4})/;

const resolveIntent = async (message: string) => {
  // 1. Check for explicit self-identification (strongest signal)
  //    e.g., "I am a producer", "I want to invest"
  const selfId = detectSelfIdentification(message);
  if (selfId) {
    return {
      category: selfId,
      source: "keyword" as const,
    };
  }

  // 2. Use AI classification (context-aware, distinguishes questions from intent)
  const aiCategory = await classifyIntentWithGemini(message);
  return {
    category: aiCategory,
    source: process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY
      ? ("gemini" as const)
      : ("fallback" as const),
  };
};

const extractContactData = (message: string) => ({
  email: message.match(emailRegex)?.[0],
  phone: message.match(phoneRegex)?.[0],
});

const generateAnonymousUserId = () =>
  new mongoose.Types.ObjectId().toString();

const getContactAcknowledgement = (contactData: {
  email?: string;
  phone?: string;
}) => {
  if (contactData.email && contactData.phone) {
    return CONTACT_CAPTURE_MESSAGES.BOTH;
  }

  if (contactData.email) {
    return CONTACT_CAPTURE_MESSAGES.EMAIL;
  }

  if (contactData.phone) {
    return CONTACT_CAPTURE_MESSAGES.PHONE;
  }

  return null;
};

const startConversation = async ({ userId }: StartConversationInput) => {
  return {
    _id: null,
    userId: userId || null,
    currentFlow: null,
    messageStep: 0,
    tags: [],
    capturedData: {},
    messages: [
      {
        sender: "assistant",
        text: ASSISTANT_DEFAULT_MESSAGE,
        step: 0,
        delayMs: 0,
        createdAt: new Date(),
      },
    ],
    profileType: null,
    classificationSource: "fallback",
    status: "ACTIVE",
    createdAt: new Date(),
  };
};

const sendMessage = async ({ conversationId, userId, message }: SendMessageInput) => {
  let conversation = conversationId
    ? await db.conversation.findById(conversationId)
    : null;

  if (conversationId && !conversation) {
    throw new ApiError(httpStatus.NOT_FOUND, "Conversation not found");
  }

  const trimmedMessage = message.trim();
  if (!trimmedMessage) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Message is required");
  }

  if (!conversation) {
    conversation = await db.conversation.create({
      userId: userId || generateAnonymousUserId(),
      currentFlow: null,
      messageStep: 0,
      tags: [],
      capturedData: {},
      messages: [
        {
          sender: "assistant",
          text: ASSISTANT_DEFAULT_MESSAGE,
          step: 0,
          delayMs: 0,
          createdAt: new Date(),
        },
      ],
      profileType: null,
      classificationSource: "fallback",
      status: "ACTIVE",
    });
  }

  conversation.messages.push(buildUserMessage(trimmedMessage));

  if (!conversation.tags.includes("NEW")) {
    conversation.tags = addUniqueTags(conversation.tags, ["NEW"]);
  }

  const contactData = extractContactData(trimmedMessage);

  if (conversation.status === "COMPLETED") {
    if (conversation.currentFlow && conversation.currentFlow !== "GENERAL") {
      if (contactData.email) {
        conversation.capturedData.email = contactData.email;
        conversation.tags = addUniqueTags(conversation.tags, ["EMAIL_RECEIVED"]);
      }
      if (contactData.phone) {
        conversation.capturedData.phone = contactData.phone;
        conversation.tags = addUniqueTags(conversation.tags, ["PHONE_RECEIVED"]);
      }
    }

    await conversation.save();
    return {
      conversation,
      assistantMessage: null,
      conversationClosed: true,
    };
  }

  if (
    conversation.status === "WAITING_FOR_CONTACT" &&
    conversation.currentFlow &&
    conversation.currentFlow !== "GENERAL"
  ) {
    let assistantMessage = null;

    if (contactData.email || contactData.phone) {
      if (contactData.email) {
        conversation.capturedData.email = contactData.email;
        conversation.tags = addUniqueTags(conversation.tags, ["EMAIL_RECEIVED"]);
      }
      if (contactData.phone) {
        conversation.capturedData.phone = contactData.phone;
        conversation.tags = addUniqueTags(conversation.tags, ["PHONE_RECEIVED"]);
      }

      const acknowledgement = getContactAcknowledgement(contactData);
      if (acknowledgement) {
        assistantMessage = buildAssistantMessage(
          conversation.currentFlow,
          acknowledgement,
          conversation.messageStep + 1
        );
        conversation.messages.push(assistantMessage);
        conversation.messageStep += 1;
      }

      conversation.status = "COMPLETED";
    }

    await conversation.save();

    return {
      conversation,
      assistantMessage,
      conversationClosed: conversation.status === "COMPLETED",
    };
  }

  if (!conversation.currentFlow) {
    // First message — classify intent
    const intent = await resolveIntent(trimmedMessage);
    conversation.currentFlow = intent.category;
    conversation.classificationSource = intent.source;
    conversation.profileType =
      intent.category === "GENERAL" ? "fan" : "professional";
    conversation.tags = addUniqueTags(conversation.tags, [
      ...mapIntentToTags(intent.category, trimmedMessage),
      "ENGAGED",
    ]);
  } else {
    // Subsequent messages — check if user reveals professional intent
    // Use self-identification detection (not broad keywords) to avoid
    // misclassifying questions like "Who is the director?" as CREATIVE
    const keywordMatch = detectSelfIdentification(trimmedMessage);

    if (keywordMatch && keywordMatch !== conversation.currentFlow) {
      // User explicitly identified as a professional — switch flow
      console.log(
        `🔄 Flow upgrade: ${conversation.currentFlow} → ${keywordMatch} (keyword)`
      );
      conversation.currentFlow = keywordMatch;
      conversation.classificationSource = "keyword";
      conversation.profileType = "professional";
      conversation.messageStep = 0; // Reset step for new flow
      conversation.tags = addUniqueTags(conversation.tags, [
        ...mapIntentToTags(keywordMatch, trimmedMessage),
      ]);
    } else if (
      conversation.currentFlow === "PRODUCER" &&
      conversation.messageStep === 1
    ) {
      const branch = detectProducerBranch(trimmedMessage);
      if (branch === "creative") {
        conversation.tags = addUniqueTags(conversation.tags, [
          "CREATIVE",
          "PRODUCER_CREATIVE",
        ]);
      }
      if (branch === "financing") {
        conversation.tags = addUniqueTags(conversation.tags, [
          "PRODUCER_FINANCING",
        ]);
      }
    }
  }

  if (conversation.currentFlow !== "GENERAL") {
    if (contactData.email) {
      conversation.capturedData.email = contactData.email;
      conversation.tags = addUniqueTags(conversation.tags, ["EMAIL_RECEIVED"]);
    }
    if (contactData.phone) {
      conversation.capturedData.phone = contactData.phone;
      conversation.tags = addUniqueTags(conversation.tags, ["PHONE_RECEIVED"]);
    }
  }

  const replyLimit = getReplyLimitForFlow(conversation.currentFlow);
  if (conversation.currentFlow !== "GENERAL" && conversation.messageStep >= replyLimit) {
    conversation.status = "COMPLETED";
    await conversation.save();
    return {
      conversation,
      assistantMessage: null,
      conversationClosed: conversation.status === "COMPLETED",
    };
  }

  const nextStep = conversation.messageStep + 1;
  let producerBranch: "financing" | "creative" | null = null;

  if (conversation.currentFlow === "PRODUCER" && nextStep > 1) {
    producerBranch = detectProducerBranch(trimmedMessage);
    if (
      !conversation.tags.includes("PRODUCER_FINANCING") &&
      !conversation.tags.includes("PRODUCER_CREATIVE")
    ) {
      producerBranch = producerBranch ?? "financing";
    } else if (conversation.tags.includes("PRODUCER_CREATIVE")) {
      producerBranch = "creative";
    } else {
      producerBranch = "financing";
    }
  }

  let replyText: string;

  if (conversation.currentFlow === "GENERAL") {
    // Use AI for dynamic, contextual responses in the GENERAL flow
    const aiResponse = await generateChatResponse(conversation.messages);
    if (aiResponse) {
      replyText = aiResponse;
    } else {
      // AI failed — use a honest fallback instead of a scripted non-answer
      console.warn("⚠️ AI response failed for GENERAL flow, using fallback");
      replyText =
        "Hmm, give me a sec on that one — could you rephrase or ask again?";
    }
  } else {
    // Professional flows use scripted responses for lead capture
    replyText = getFlowReply(
      conversation.currentFlow,
      nextStep,
      producerBranch
    );
  }

  const assistantMessage = buildAssistantMessage(
    conversation.currentFlow,
    replyText,
    nextStep
  );

  conversation.messageStep = nextStep;
  conversation.messages.push(assistantMessage);

  if (shouldWaitForContact(conversation.currentFlow, nextStep)) {
    conversation.status = "WAITING_FOR_CONTACT";
  }

  if (shouldCompleteAfterReply(conversation.currentFlow, nextStep)) {
    conversation.status = "COMPLETED";
  }

  if (
    conversation.currentFlow !== "GENERAL" &&
    nextStep > PROFESSIONAL_REPLY_LIMIT
  ) {
    conversation.status = "COMPLETED";
  }

  await conversation.save();

  return {
    conversation,
    assistantMessage,
    conversationClosed: conversation.status === "COMPLETED",
  };
};

const getConversationById = async (conversationId: string) => {
  const conversation = await db.conversation.findById(conversationId);
  if (!conversation) {
    throw new ApiError(httpStatus.NOT_FOUND, "Conversation not found");
  }

  return conversation;
};

const conversationService = {
  startConversation,
  sendMessage,
  getConversationById,
};

export default conversationService;
