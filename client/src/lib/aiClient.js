const API_HOST = "http://localhost:4000";

const AI_BASE_PATH = "/api/ai";

const AI_ACTION_ENDPOINTS = {
  explain: "/explain",
  fix: "/fix",
  optimize: "/optimize",
  generate: "/generate",
  comment: "/comment",
  convert: "/convert",
  explainError: "/explain-error",
  review: "/review",
  debug: "/debug",
};

function getAIEndpointPath(action) {
  const endpoint = AI_ACTION_ENDPOINTS[action];

  if (!endpoint) {
    throw new Error(`Unsupported AI action: ${action}`);
  }

  return `${AI_BASE_PATH}${endpoint}`;
}

function createAIRequestPayload(action, values = {}) {
  const commonPayload = {
    language: values.language,
  };

  switch (action) {
    case "generate":
      return {
        ...commonPayload,
        description: values.description,
      };
    case "convert":
      return {
        code: values.code,
        fromLanguage: values.fromLanguage,
        toLanguage: values.toLanguage,
      };
    case "explainError":
      return {
        ...commonPayload,
        code: values.code,
        errorOutput: values.errorOutput,
      };
    case "fix":
      return {
        ...commonPayload,
        code: values.code,
        error: values.error,
      };
    case "explain":
    case "optimize":
    case "comment":
    case "review":
    case "debug":
      return {
        ...commonPayload,
        code: values.code,
      };
    default:
      throw new Error(`Unsupported AI action: ${action}`);
  }
}

export async function fetchAIStatus() {
  try {
    const res = await fetch(`${API_HOST}${AI_BASE_PATH}/status`);
    const data = await res.json();
    return data.enabled === true;
  } catch {
    return false;
  }
}

export async function callAIAction(action, values = {}) {
  const path = getAIEndpointPath(action);
  const payload = createAIRequestPayload(action, values);

  let response;
  try {
    response = await fetch(`${API_HOST}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error("Cannot reach the AI server. Make sure the backend is running.");
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(`AI server returned an unexpected response (HTTP ${response.status}).`);
  }

  if (!response.ok) {
    throw new Error(data.error || "AI request failed.");
  }

  return data;
}

export function extractResponseText(action, data) {
  switch (action) {
    case "explain":
    case "explainError":
      return data.explanation || "";
    case "fix":
      return data.fixedCode || data.diffSummary || "";
    case "optimize":
      return data.optimizedCode || data.notes || "";
    case "generate":
      return data.code || "";
    case "comment":
      return data.commentedCode || "";
    case "convert":
      return data.convertedCode || "";
    case "review":
      return data.review || "";
    case "debug":
      return data.analysis || data.suggestedFix || "";
    default:
      return JSON.stringify(data, null, 2);
  }
}

export async function fetchCodeReview({ code, language, output }) {
  let response;
  try {
    response = await fetch(`${API_HOST}/api/ai/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, language, output }),
    });
  } catch {
    throw new Error("Cannot reach the AI server.");
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(`AI server returned an unexpected response (HTTP ${response.status}).`);
  }

  if (!response.ok) {
    throw new Error(data.error || "Code review request failed.");
  }

  return data;
}