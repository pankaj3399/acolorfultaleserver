import InstagramConversation from "../models/instagramConversation";

type ListQuery = {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  profileType?: string;
  tag?: string;
  startDate?: string;
  endDate?: string;
};

const buildMatch = (query: ListQuery) => {
  const match: Record<string, any> = {};

  if (query.profileType) {
    match.profileType = query.profileType;
  }
  if (query.status) {
    match.status = query.status;
  }
  if (query.tag) {
    match.tags = query.tag;
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
      { instagramUserId: { $regex: query.search, $options: "i" } },
      { "capturedData.email": { $regex: query.search, $options: "i" } },
      { "capturedData.phone": { $regex: query.search, $options: "i" } },
      { tags: { $elemMatch: { $regex: query.search, $options: "i" } } },
    ];
  }

  return match;
};

const getOverview = async () => {
  const [result] = await InstagramConversation.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        active: {
          $sum: { $cond: [{ $eq: ["$status", "ACTIVE"] }, 1, 0] },
        },
        completed: {
          $sum: { $cond: [{ $eq: ["$status", "COMPLETED"] }, 1, 0] },
        },
        waitingForContact: {
          $sum: {
            $cond: [{ $eq: ["$status", "WAITING_FOR_CONTACT"] }, 1, 0],
          },
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
        professionals: {
          $sum: {
            $cond: [{ $eq: ["$profileType", "professional"] }, 1, 0],
          },
        },
        fans: {
          $sum: { $cond: [{ $eq: ["$profileType", "fan"] }, 1, 0] },
        },
      },
    },
  ]);

  return (
    result || {
      total: 0,
      active: 0,
      completed: 0,
      waitingForContact: 0,
      emailsCollected: 0,
      phonesCollected: 0,
      professionals: 0,
      fans: 0,
    }
  );
};

const getConversations = async (query: ListQuery) => {
  const match = buildMatch(query);
  const skip = (query.page - 1) * query.limit;

  const [rows, total] = await Promise.all([
    InstagramConversation.find(match)
      .select(
        "instagramUserId profileType classificationSource status tags capturedData createdAt updatedAt"
      )
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(query.limit)
      .lean(),
    InstagramConversation.countDocuments(match),
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

const getConversationById = async (id: string) => {
  return InstagramConversation.findById(id).lean();
};

const toCsv = (rows: any[]) => {
  const headers = [
    "instagramUserId",
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
      row.instagramUserId,
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
  getConversations,
  getConversationById,
  toCsv,
};
