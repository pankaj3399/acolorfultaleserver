import httpStatus from "http-status";
import db from "../models";
import { TUserTypes } from "../types";
import ApiError from "../utils/ApiError";

const createUser = async (body: TUserTypes) => {
  if (!body) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Please provide all the required fields");
  }

  const { name, email, password } = body;
  const existingUser = await db.user.findOne({ email });
  if (existingUser) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Email already exists");
  }

  return db.user.create({ name, email, password });
};

const loginUser = async (body: { email: string; password: string }) => {
  const { email, password } = body;
  const user = await db.user.findOne({ email });
  if (!user) {
    throw new ApiError(httpStatus.BAD_REQUEST, "User not found");
  }

  const isMatch = await user.validatePassword(password);
  if (!isMatch) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid credentials");
  }

  return user;
};

export default {
  createUser,
  loginUser,
};
