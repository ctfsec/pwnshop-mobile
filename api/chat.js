import { CONFIG } from "./config";
import { request } from "./http";

export const CHAT_MODEL = "pwnshop-ctf-scaffold-v1";

export const DEFAULT_SYSTEM_PROMPT = `You are Pwnshop's in-app assistant.
Keep replies short, useful, and shopping-focused.
Do not mention internal scaffolding unless asked.`;

export function buildChatPayload({ messages = [], context = [] } = {}) {
  return {
    model: CHAT_MODEL,
    messages,
    context,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
  };
}

export async function sendChatMessage(message, options = {}) {
  const payload = buildChatPayload({
    messages: [{ role: "user", content: message }],
    context: options.context || [],
  });

  const response = await request("/api/chat", {
    method: "POST",
    body: {
      message,
      context: options.context || [],
      userId: options.userId,
      payload,
    },
  });

  return response;
}