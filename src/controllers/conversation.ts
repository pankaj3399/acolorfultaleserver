import { Request, Response } from "express";
import httpStatus from "http-status";
import conversationService from "../services/conversation";
import catchAsync from "../utils/catchAsync";

export const startConversation = catchAsync(async (req: Request, res: Response) => {
  const conversation = await conversationService.startConversation(req.body);
  res.status(httpStatus.CREATED).json({ conversation });
});

export const sendConversationMessage = catchAsync(
  async (req: Request, res: Response) => {
    const result = await conversationService.sendMessage(req.body);
    res.status(httpStatus.OK).json(result);
  }
);

export const getConversation = catchAsync(async (req: Request, res: Response) => {
  const conversation = await conversationService.getConversationById(req.params.id);
  res.status(httpStatus.OK).json({ conversation });
});
