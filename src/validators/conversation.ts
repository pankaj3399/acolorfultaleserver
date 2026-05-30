import Joi from "joi";

export const startConversationValidator = {
  body: Joi.object().keys({
    userId: Joi.string().trim().optional(),
  }),
};

export const sendMessageValidator = {
  body: Joi.object().keys({
    conversationId: Joi.string().trim().allow(null).optional(),
    userId: Joi.string().trim().allow(null).optional(),
    message: Joi.string().trim().required(),
  }),
};

export const getConversationValidator = {
  params: Joi.object().keys({
    id: Joi.string().trim().required(),
  }),
};
