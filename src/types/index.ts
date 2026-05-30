export type IntentCategory = "INVESTOR" | "PRODUCER" | "CREATIVE" | "GENERAL";

export type TUserTypes = {
  name: string;
  email: string;
  password: string;
};

export type ConversationTag =
  | "NEW"
  | "ENGAGED"
  | "EMAIL_RECEIVED"
  | "PHONE_RECEIVED"
  | "INVESTOR"
  | "PRODUCER"
  | "PRODUCER_FINANCING"
  | "PRODUCER_CREATIVE"
  | "CREATIVE"
  | "CREATIVE_ACTOR"
  | "CREATIVE_ACTRESS"
  | "CREATIVE_DIRECTOR"
  | "CREATIVE_FILMMAKER"
  | "CREATIVE_PRODUCER"
  | "CREATIVE_CINEMATOGRAPHER"
  | "CREATIVE_EDITOR"
  | "CREATIVE_COMPOSER"
  | "CREATIVE_DP"
  | "CREATIVE_PRODUCTION_DESIGNER"
  | "CREATIVE_DEVELOPMENT"
  | "CREATIVE_COLLABORATION"
  | "GENERAL_SUPPORT";

export type MessageSender = "user" | "assistant";

export type MessageRecord = {
  sender: MessageSender;
  text: string;
  createdAt?: Date;
  step?: number;
  delayMs?: number;
  quickReplies?: string[];
};

export type ConversationStatus = "ACTIVE" | "WAITING_FOR_CONTACT" | "COMPLETED";

export type ConversationDocumentShape = {
  userId: string;
  currentFlow: IntentCategory | null;
  messageStep: number;
  tags: ConversationTag[];
  capturedData: {
    email?: string;
    phone?: string;
  };
  messages: MessageRecord[];
  profileType: "professional" | "fan" | null;
  classificationSource: "keyword" | "gemini" | "fallback";
  status: ConversationStatus;
};
