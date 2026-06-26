const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";
const DEFAULT_MAX_TOKENS = 1200;
const DEFAULT_TEMPERATURE = 0.2;

export class OpenRouterConfigurationError extends Error {
  constructor(message = "OPENROUTER_API_KEY is not configured.") {
    super(message);
    this.name = "OpenRouterConfigurationError";
    this.statusCode = 500;
  }
}

export class OpenRouterAPIError extends Error {
  constructor(message, statusCode, details) {
    super(message);
    this.name = "OpenRouterAPIError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

function getOpenRouterApiKey() {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new OpenRouterConfigurationError();
  }

  return apiKey;
}

export function hasOpenRouterApiKey() {
  return Boolean(process.env.OPENROUTER_API_KEY);
}

function normalizeMessages(messages) {
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new TypeError("messages must be a non-empty array.");
  }

  return messages.map((message) => {
    if (!message || typeof message.role !== "string" || typeof message.content !== "string") {
      throw new TypeError("Each message must include string role and content fields.");
    }

    return {
      role: message.role,
      content: message.content,
    };
  });
}

export async function createChatCompletion({
  messages,
  model = DEFAULT_MODEL,
  maxTokens = DEFAULT_MAX_TOKENS,
  temperature = DEFAULT_TEMPERATURE,
}) {
  const apiKey = getOpenRouterApiKey();

  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "X-Title": "Collaborative Code Editor",
    },
    body: JSON.stringify({
      model,
      messages: normalizeMessages(messages),
      max_tokens: maxTokens,
      temperature,
    }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.error?.message || "OpenRouter request failed.";
    throw new OpenRouterAPIError(message, response.status, data);
  }

  return data;
}

export function extractAssistantText(completion) {
  return completion?.choices?.[0]?.message?.content?.trim() || "";
}
