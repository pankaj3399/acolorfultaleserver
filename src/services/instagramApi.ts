/**
 * Instagram Graph API helpers for sending messages via the Messenger platform.
 */

const GRAPH_API_BASE = "https://graph.instagram.com/v25.0/me/messages";

/**
 * Fetch a messaging participant's public profile by their IG-scoped ID.
 * The messaging webhook only provides the sender's ID, not their handle.
 * Returns {} on any failure so callers can degrade gracefully.
 */
export const fetchInstagramUserProfile = async (
  accessToken: string,
  igScopedId: string
): Promise<{ username?: string; name?: string }> => {
  const url = `https://graph.instagram.com/v25.0/${igScopedId}?fields=username,name&access_token=${accessToken}`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error(
        "[IG] profile.fetch-error",
        JSON.stringify({ status: res.status, response: await res.text() })
      );
      return {};
    }
    const data = (await res.json()) as { username?: string; name?: string };
    return { username: data.username, name: data.name };
  } catch (err) {
    console.error(
      "[IG] profile.fetch-threw",
      err instanceof Error ? err.message : String(err)
    );
    return {};
  }
};

const graphFetch = async (accessToken: string, body: object) => {
  const started = Date.now();
  let res: Response;
  try {
    res = await fetch(GRAPH_API_BASE, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.error(
      "[IG] graph.fetch-threw",
      JSON.stringify({
        ms: Date.now() - started,
        error: err instanceof Error ? err.message : String(err),
      })
    );
    throw err;
  }

  if (!res.ok) {
    const text = await res.text();
    console.error(
      "[IG] graph.error",
      JSON.stringify({
        status: res.status,
        ms: Date.now() - started,
        bodyKeys: Object.keys(body),
        response: text,
      })
    );
  } else {
    console.log(
      "[IG] graph.ok",
      JSON.stringify({
        status: res.status,
        ms: Date.now() - started,
        bodyKeys: Object.keys(body),
      })
    );
  }

  return res;
};

/** Send a plain text message */
export const sendInstagramMessage = (
  accessToken: string,
  userId: string,
  text: string
) =>
  graphFetch(accessToken, {
    recipient: { id: userId },
    message: { text },
  });

/** Send a typing indicator */
export const sendInstagramTypingIndicator = (
  accessToken: string,
  userId: string
) =>
  graphFetch(accessToken, {
    recipient: { id: userId },
    sender_action: "typing_on",
  });

/** Send a button template (e.g. "Talk to agent" / "Continue with AI") */
export const sendInstagramButtonTemplate = (
  accessToken: string,
  userId: string,
  title: string,
  buttons: Array<{ title: string; payload: string }>
) =>
  graphFetch(accessToken, {
    recipient: { id: userId },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text: title,
          buttons: buttons.map((b) => ({
            type: "postback",
            title: b.title,
            payload: b.payload,
          })),
        },
      },
    },
  });
