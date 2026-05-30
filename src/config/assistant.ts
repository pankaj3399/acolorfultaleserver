export const ASSISTANT_DEFAULT_MESSAGE =
  "Hi I am AI-GENT 001, Ohitiin's personal assistant. How may I help you?";

export const MIN_REPLY_DELAY_MS = 45 * 1000;
export const MAX_REPLY_DELAY_MS = 15 * 60 * 1000;

export const INVESTOR_KEYWORDS = [
  "invest",
  "investor",
  "investment",
  "fund",
  "funding",
  "finance",
  "financing",
  "capital",
  "equity",
  "raise",
  "slate",
  "gap",
  "presales",
  "distribution",
  "backer",
  "budget",
];

export const PRODUCER_KEYWORDS = [
  "producer",
  "producing",
  "film producer",
];

export const CREATIVE_KEYWORDS = [
  "director",
  "actor",
  "actress",
  "filmmaker",
  "cinematographer",
  "dp",
  "editor",
  "composer",
  "collaborate",
  "collaboration",
  "creative producer",
  "attach talent",
  "development",
  "packaging",
  "production designer",
];

export const CREATIVE_SUBTYPE_TAGS: Record<string, string> = {
  actor: "CREATIVE_ACTOR",
  actress: "CREATIVE_ACTRESS",
  director: "CREATIVE_DIRECTOR",
  filmmaker: "CREATIVE_FILMMAKER",
  "creative producer": "CREATIVE_PRODUCER",
  editor: "CREATIVE_EDITOR",
  composer: "CREATIVE_COMPOSER",
  cinematographer: "CREATIVE_CINEMATOGRAPHER",
  dp: "CREATIVE_DP",
  "production designer": "CREATIVE_PRODUCTION_DESIGNER",
  development: "CREATIVE_DEVELOPMENT",
  collaborate: "CREATIVE_COLLABORATION",
  collaboration: "CREATIVE_COLLABORATION",
};

export const PROFESSIONAL_REPLY_LIMIT = 4;
export const GENERAL_REPLY_LIMIT = 20;

export const FLOW_MESSAGES = {
  INVESTOR: [
    "Thank you for reaching out — we truly appreciate your interest in A Colorful Tale. May I ask what initially caught your attention about the project?",
    "Thank you for sharing that. Out of curiosity, have you previously been involved with film investments or projects in development?",
    "That’s really interesting to hear. When you look at a new project, what usually draws your interest first — the story itself, the creative team involved, or the overall potential of the project?",
    "I’ve really appreciated hearing your perspective on this. If you’re open to continuing the conversation, just drop your email or phone number right here in this chat and someone from our team will follow up with you directly.",
  ],
  PRODUCER: [
    "Thank you for reaching out — we really appreciate your interest in A Colorful Tale. May I ask if you’re approaching this more from a creative standpoint or from a financing / production standpoint?",
    "Thank you for clarifying. May I ask what types of projects you typically help finance?",
    "That’s really helpful to hear. When you look at a new project, what usually draws your interest first — the story itself, the creative team attached, or the overall production approach? And are you usually involved during the development stage, or later when projects move into production and financing?",
    "I’ve really appreciated hearing your perspective on this. If you’re open to continuing the conversation, just drop your email or phone number right here in this chat and someone from our team will follow up with you directly.",
  ],
  CREATIVE: [
    "Thank you for reaching out — we really appreciate your interest in A Colorful Tale. May I ask what aspect of the story resonated with you?",
    "It’s always interesting to hear how people connect with the material. Out of curiosity, what type of creative work do you usually focus on?",
    "That’s great to hear. What kinds of stories or characters tend to draw you in the most when you’re developing or collaborating on a project?",
    "I’ve really appreciated hearing your perspective on this. If you’re open to continuing the conversation, just drop your email or phone number right here in this chat and someone from our team will follow up with you directly.",
  ],
  GENERAL: [
    "Thanks for reaching out! Great to see someone interested in A Colorful Tale. What caught your eye about the project?",
    "Interesting — every viewer connects with a story differently. What drew you to this one specifically?",
    "That makes sense. A lot of people find something personal in Blue’s journey. Is there anything specific about the film you’d like to know more about?",
    "Glad we got to chat about this. If you have more questions about A Colorful Tale, I’m here.",
    "Anything else you’re curious about — the story, the characters, how it came together?",
  ],
} as const;

export const GENERAL_CONTINUATION_MESSAGES = [
  "That’s a really interesting way to look at it. Is there anything else about the film you’re curious about?",
  "Good question — I’d love to keep chatting. What else is on your mind about A Colorful Tale?",
  "There’s a lot to unpack with this story. Anything else you want to know?",
] as const;

export const CONTACT_CAPTURE_MESSAGES = {
  BOTH: "Got it — I’ve noted your email and phone number. Someone from our team will reach out to you soon.",
  EMAIL: "Got it — I’ve noted your email. Someone from our team will reach out to you soon.",
  PHONE: "Got it — I’ve noted your phone number. Someone from our team will reach out to you soon.",
  REMINDER:
    "Whenever you’re ready, just drop your email or phone number right here in this chat so someone from our team can follow up with you.",
} as const;
