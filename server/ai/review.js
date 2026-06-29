import { Router } from "express";
import {
  createChatCompletion,
  extractAssistantText,
  hasOpenRouterApiKey,
  OpenRouterConfigurationError,
  OpenRouterAPIError,
} from "./aiClient.js";
import { trimCodeContext } from "./prompts.js";

const router = Router();

const MAX_CODE_LENGTH = 15000;

const CODE_REVIEW_PROMPT = `You are an expert code reviewer. Analyze the provided code and return a structured review as valid JSON.

Evaluate these six categories, each with a score from 1 to 10 and an array of specific findings:

1. bugs — Potential bugs, logic errors, off-by-one errors, null/undefined risks, unhandled edge cases
2. security — Injection vulnerabilities, data exposure, improper input validation, auth issues
3. performance — Unnecessary allocations, redundant iterations, blocking operations, scalability concerns
4. codeQuality — Readability, naming conventions, code structure, DRY violations, dead code
5. bestPractices — Language idioms, proper error handling, design patterns, consistent conventions
6. maintainability — Modularity, testability, coupling, cohesion, documentation needs

Return ONLY valid JSON with no markdown fences, matching this exact schema:
{
  "summary": "One-sentence overall assessment",
  "overallScore": 7,
  "categories": {
    "bugs": { "score": 8, "findings": ["Specific finding here"] },
    "security": { "score": 9, "findings": [] },
    "performance": { "score": 7, "findings": ["Specific finding here"] },
    "codeQuality": { "score": 8, "findings": ["Specific finding here"] },
    "bestPractices": { "score": 7, "findings": ["Specific finding here"] },
    "maintainability": { "score": 8, "findings": [] }
  }
}

A score of 10 means excellent (no issues). Lower scores indicate more or worse issues.
If a category has no issues, use an empty findings array and a score of 10.
Each finding should be a concise, actionable sentence.`;

const CATEGORY_LABELS = {
  bugs: "Bugs",
  security: "Security",
  performance: "Performance",
  codeQuality: "Code Quality",
  bestPractices: "Best Practices",
  maintainability: "Maintainability",
};

const CATEGORY_KEYS = Object.keys(CATEGORY_LABELS);

function clampScore(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 5;
  return Math.max(1, Math.min(10, Math.round(n)));
}

function normalizeReview(parsed) {
  const categories = {};

  for (const key of CATEGORY_KEYS) {
    const cat = parsed.categories?.[key];
    categories[key] = {
      label: CATEGORY_LABELS[key],
      score: clampScore(cat?.score),
      findings: Array.isArray(cat?.findings)
        ? cat.findings.filter((f) => typeof f === "string")
        : [],
    };
  }

  return {
    summary: typeof parsed.summary === "string" ? parsed.summary : "Review complete.",
    overallScore: clampScore(parsed.overallScore),
    categories,
  };
}

function fallbackReview(text) {
  const categories = {};
  for (const key of CATEGORY_KEYS) {
    categories[key] = {
      label: CATEGORY_LABELS[key],
      score: 5,
      findings: [],
    };
  }

  return {
    summary: text.slice(0, 200) || "Review could not be structured.",
    overallScore: 5,
    categories,
    raw: text,
  };
}

function parseReviewResponse(text) {
  let jsonStr = text.trim();

  const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    jsonStr = fenceMatch[1].trim();
  }

  try {
    const parsed = JSON.parse(jsonStr);
    return normalizeReview(parsed);
  } catch {
    return fallbackReview(text);
  }
}

router.post("/", async (req, res) => {
  if (process.env.ENABLE_AI === "false") {
    return res.status(503).json({ error: "AI features are disabled." });
  }
  if (!hasOpenRouterApiKey()) {
    return res.status(503).json({ error: "AI service is not configured." });
  }

  const { code, language, output } = req.body;

  if (typeof code !== "string" || code.trim().length === 0) {
    return res.status(400).json({ error: "code must be a non-empty string." });
  }
  if (code.length > MAX_CODE_LENGTH) {
    return res
      .status(400)
      .json({ error: `code exceeds the ${MAX_CODE_LENGTH} character limit.` });
  }

  const userContent = [
    `Language: ${language || "plaintext"}`,
    output ? `Execution output:\n${output.slice(0, 2000)}` : null,
    "Code:",
    "```",
    trimCodeContext(code),
    "```",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const completion = await createChatCompletion({
      messages: [
        { role: "system", content: CODE_REVIEW_PROMPT },
        { role: "user", content: userContent },
      ],
      maxTokens: 1500,
    });

    const text = extractAssistantText(completion);
    const review = parseReviewResponse(text);
    res.json(review);
  } catch (error) {
    if (error instanceof OpenRouterConfigurationError) {
      return res.status(503).json({ error: "AI service is not configured." });
    }
    if (error instanceof OpenRouterAPIError) {
      return res
        .status(502)
        .json({ error: "AI provider returned an error.", detail: error.message });
    }
    console.error("Code review error:", error.message);
    return res.status(500).json({ error: "An unexpected error occurred." });
  }
});

export default router;
