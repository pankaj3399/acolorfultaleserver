import Joi from "joi";

export const adminLoginValidator = {
  body: Joi.object().keys({
    username: Joi.string().trim().required(),
    password: Joi.string().required(),
  }),
};

export const analyticsListValidator = {
  query: Joi.object().keys({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    search: Joi.string().trim().allow(""),
    sortBy: Joi.string()
      .valid(
        "createdAt",
        "userId",
        "profileType",
        "classificationSource",
        "status"
      )
      .default("createdAt"),
    sortOrder: Joi.string().valid("asc", "desc").default("desc"),
    profileType: Joi.string().valid("professional", "fan"),
    classificationSource: Joi.string().valid("keyword", "gemini", "fallback"),
    status: Joi.string().valid("ACTIVE", "WAITING_FOR_CONTACT", "COMPLETED"),
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso(),
    export: Joi.string().valid("csv"),
  }),
};
