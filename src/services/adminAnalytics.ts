import db from "../models";

type AnalyticsListQuery = {
  page: number;
  limit: number;
  search?: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
  profileType?: string;
  classificationSource?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
};

const getTrackedConversationMatch = () => ({
  tags: { $in: ["NEW"] },
});

const buildMatch = (query: AnalyticsListQuery) => {
  const match: Record<string, any> = getTrackedConversationMatch();

  if (query.profileType) {
    match.profileType = query.profileType;
  }
  if (query.classificationSource) {
    match.classificationSource = query.classificationSource;
  }
  if (query.status) {
    match.status = query.status;
  }
  if (query.startDate || query.endDate) {
    match.createdAt = {};
    if (query.startDate) {
      match.createdAt.$gte = new Date(query.startDate);
    }
    if (query.endDate) {
      const end = new Date(query.endDate);
      end.setHours(23, 59, 59, 999);
      match.createdAt.$lte = end;
    }
  }
  if (query.search) {
    match.$or = [
      { userId: { $regex: query.search, $options: "i" } },
      { "capturedData.email": { $regex: query.search, $options: "i" } },
      { "capturedData.phone": { $regex: query.search, $options: "i" } },
      { tags: { $elemMatch: { $regex: query.search, $options: "i" } } },
    ];
  }

  return match;
};

const getOverview = async () => {
  const [result] = await db.conversation.aggregate([
    {
      $match: getTrackedConversationMatch(),
    },
    {
      $group: {
        _id: null,
        totalUsers: { $sum: 1 },
        totalProfessionals: {
          $sum: { $cond: [{ $eq: ["$profileType", "professional"] }, 1, 0] },
        },
        totalFans: {
          $sum: { $cond: [{ $eq: ["$profileType", "fan"] }, 1, 0] },
        },
        emailsCollected: {
          $sum: {
            $cond: [{ $ifNull: ["$capturedData.email", false] }, 1, 0],
          },
        },
        phonesCollected: {
          $sum: {
            $cond: [{ $ifNull: ["$capturedData.phone", false] }, 1, 0],
          },
        },
      },
    },
  ]);

  return (
    result || {
      totalUsers: 0,
      totalProfessionals: 0,
      totalFans: 0,
      emailsCollected: 0,
      phonesCollected: 0,
    }
  );
};

const getList = async (query: AnalyticsListQuery) => {
  const match = buildMatch(query);
  const sort: Record<string, 1 | -1> = {
    [query.sortBy]: query.sortOrder === "asc" ? 1 : -1,
  };

  const skip = (query.page - 1) * query.limit;

  const [rows, total] = await Promise.all([
    db.conversation
      .find(match)
      .select("userId profileType classificationSource status tags capturedData createdAt")
      .sort(sort)
      .skip(skip)
      .limit(query.limit)
      .lean(),
    db.conversation.countDocuments(match),
  ]);

  return {
    rows,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit) || 1,
    },
  };
};

const getTags = async () => {
  return db.conversation.aggregate([
    { $match: getTrackedConversationMatch() },
    { $unwind: "$tags" },
    { $group: { _id: "$tags", count: { $sum: 1 } } },
    { $sort: { count: -1, _id: 1 } },
    { $project: { _id: 0, tag: "$_id", count: 1 } },
  ]);
};

const getFunnel = async () => {
  const [result] = await db.conversation.aggregate([
    {
      $match: getTrackedConversationMatch(),
    },
    {
      $group: {
        _id: null,
        ACTIVE: { $sum: { $cond: [{ $eq: ["$status", "ACTIVE"] }, 1, 0] } },
        COMPLETED: { $sum: { $cond: [{ $eq: ["$status", "COMPLETED"] }, 1, 0] } },
        NEW: { $sum: { $cond: [{ $in: ["NEW", "$tags"] }, 1, 0] } },
        ENGAGED: { $sum: { $cond: [{ $in: ["ENGAGED", "$tags"] }, 1, 0] } },
        WAITING_FOR_CONTACT: {
          $sum: { $cond: [{ $eq: ["$status", "WAITING_FOR_CONTACT"] }, 1, 0] },
        },
        EMAIL_RECEIVED: {
          $sum: { $cond: [{ $in: ["EMAIL_RECEIVED", "$tags"] }, 1, 0] },
        },
        PHONE_RECEIVED: {
          $sum: { $cond: [{ $in: ["PHONE_RECEIVED", "$tags"] }, 1, 0] },
        },
      },
    },
  ]);

  return (
    result || {
      ACTIVE: 0,
      COMPLETED: 0,
      NEW: 0,
      ENGAGED: 0,
      WAITING_FOR_CONTACT: 0,
      EMAIL_RECEIVED: 0,
      PHONE_RECEIVED: 0,
    }
  );
};

const toCsv = (rows: any[]) => {
  const headers = [
    "userId",
    "profileType",
    "classificationSource",
    "status",
    "email",
    "phone",
    "tags",
    "createdAt",
  ];

  const escape = (value: unknown) =>
    `"${String(value ?? "").replace(/"/g, '""')}"`;

  const lines = rows.map((row) =>
    [
      row.userId,
      row.profileType,
      row.classificationSource,
      row.status,
      row.capturedData?.email,
      row.capturedData?.phone,
      Array.isArray(row.tags) ? row.tags.join("|") : "",
      row.createdAt,
    ]
      .map(escape)
      .join(",")
  );

  return [headers.join(","), ...lines].join("\n");
};

export default {
  getOverview,
  getList,
  getTags,
  getFunnel,
  toCsv,
};
