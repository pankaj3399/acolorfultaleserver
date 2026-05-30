import httpStatus from "http-status";
import db from "../models";
import ApiError from "../utils/ApiError";

const loginAdmin = async (body: { username: string; password: string }) => {
  const admin = await db.admin.findOne({ username: body.username });
  if (!admin) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid credentials");
  }

  const isMatch = await admin.validatePassword(body.password);
  if (!isMatch) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid credentials");
  }

  return admin;
};

const getAdminById = async (id: string) => {
  const admin = await db.admin.findById(id).select("-password");
  if (!admin) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Admin not found");
  }
  return admin;
};

export default {
  loginAdmin,
  getAdminById,
};
