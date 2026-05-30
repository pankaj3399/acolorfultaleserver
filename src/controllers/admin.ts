import { Request, Response } from "express";
import httpStatus from "http-status";
import adminService from "../services/admin";
import adminAnalyticsService from "../services/adminAnalytics";
import catchAsync from "../utils/catchAsync";

export const adminLogin = catchAsync(async (req: Request, res: Response) => {
  const admin = await adminService.loginAdmin(req.body);
  const token = admin.generateAuthToken();

  res.status(httpStatus.OK).json({
    token,
    admin: {
      id: admin._id,
      username: admin.username,
      role: admin.role,
    },
  });
});

export const getAdminMe = catchAsync(async (req: any, res: Response) => {
  const admin = await adminService.getAdminById(req.admin._id);
  res.status(httpStatus.OK).json({ admin });
});

export const getAnalyticsOverview = catchAsync(async (_req: Request, res: Response) => {
  const overview = await adminAnalyticsService.getOverview();
  res.status(httpStatus.OK).json({ overview });
});

export const getAnalyticsList = catchAsync(async (req: Request, res: Response) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 20);
  const exportType = String(req.query.export || "");

  const result = await adminAnalyticsService.getList({
    page,
    limit,
    search: req.query.search ? String(req.query.search) : undefined,
    sortBy: req.query.sortBy ? String(req.query.sortBy) : "createdAt",
    sortOrder: req.query.sortOrder === "asc" ? "asc" : "desc",
    profileType: req.query.profileType ? String(req.query.profileType) : undefined,
    classificationSource: req.query.classificationSource
      ? String(req.query.classificationSource)
      : undefined,
    status: req.query.status ? String(req.query.status) : undefined,
    startDate: req.query.startDate ? String(req.query.startDate) : undefined,
    endDate: req.query.endDate ? String(req.query.endDate) : undefined,
  });

  if (exportType === "csv") {
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="analytics.csv"');
    res.status(httpStatus.OK).send(adminAnalyticsService.toCsv(result.rows));
    return;
  }

  res.status(httpStatus.OK).json(result);
});

export const getAnalyticsTags = catchAsync(async (_req: Request, res: Response) => {
  const tags = await adminAnalyticsService.getTags();
  res.status(httpStatus.OK).json({ tags });
});

export const getAnalyticsFunnel = catchAsync(async (_req: Request, res: Response) => {
  const funnel = await adminAnalyticsService.getFunnel();
  res.status(httpStatus.OK).json({ funnel });
});
