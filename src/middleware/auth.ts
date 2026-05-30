import { Request, Response } from "express";
import httpStatus from "http-status";
import jwt from "jsonwebtoken";
import db from "../models";

type UserRequest = Request & { user?: any };
type AdminRequest = Request & { admin?: any };

const getBearerToken = (req: Request) => {
  if (!req.headers.authorization?.startsWith("Bearer ")) {
    return null;
  }
  return req.headers.authorization.split(" ")[1];
};

export const isAuthenticated = async (
  req: UserRequest,
  res: Response,
  next: Function
) => {
  try {
    const token = getBearerToken(req);
    if (!token) {
      return res.status(httpStatus.FORBIDDEN).json({
        message: "headers does not have a bearer token",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    const authenticatedUser = await db.user.findById(decoded._id).lean();

    if (!authenticatedUser) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        message: "You are not authorized to access this route",
        success: false,
      });
    }

    req.user = authenticatedUser;
    return next();
  } catch (_error) {
    return res.status(httpStatus.UNAUTHORIZED).json({
      message: "Token expired.Login Again",
    });
  }
};

export const authMiddleware = async (
  req: AdminRequest,
  res: Response,
  next: Function
) => {
  try {
    const token = getBearerToken(req);
    if (!token) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        message: "Unauthorized",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    if (decoded.type !== "admin") {
      return res.status(httpStatus.UNAUTHORIZED).json({
        message: "Unauthorized",
      });
    }

    const admin = await db.admin.findById(decoded._id).select("-password").lean();
    if (!admin) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        message: "Unauthorized",
      });
    }

    req.admin = admin;
    return next();
  } catch (_error) {
    return res.status(httpStatus.UNAUTHORIZED).json({
      message: "Unauthorized",
    });
  }
};
