import { Request, Response } from "express";
import httpStatus from "http-status";
import userService from "../services/user";
import catchAsync from "../utils/catchAsync";

export const register = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.createUser(req.body);
  const token = user.generateAuthToken();
  res.status(httpStatus.CREATED).json({ user, token });
});

export const login = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.loginUser(req.body);
  const token = user.generateAuthToken();
  res.status(httpStatus.OK).json({ user, token });
});
