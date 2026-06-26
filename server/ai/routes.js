import { Router } from "express";
import {
  createChatCompletion,
  extractAssistantText,
  hasOpenRouterApiKey,
  OpenRouterConfigurationError,
  OpenRouterAPIError,
} from "./aiClient.js";
import { ACTION_PROMPTS, buildCodeContextMessage } from "./prompts.js";

const router = Router();

const MAX_CODE_LENGTH = 15000;

function validateCode(code) {
  if (typeof code !== "string" || code.trim().length === 0) {
    return "code must be a non-empty string.";
  }
  if (code.length > MAX_CODE_LENGTH) {
    return `code exceeds the ${MAX_CODE_LENGTH} character limit.`;
  }
  return null;
}

function handleAIError(error, res) {
  if (error instanceof OpenRouterConfigurationError) {
    return res.status(503).json({ error: "AI service is not configured." });
  }
  if (error instanceof OpenRouterAPIError) {
    return res.status(502).json({ error: "AI provider returned an error.", detail: error.message });
  }
  console.error("AI route error:", error.message);
  return res.status(500).json({ error: "An unexpected error occurred." });
}

function aiGuard(req, res, next) {
  if (process.env.ENABLE_AI === "false") {
    return res.status(503).json({ error: "AI features are disabled." });
  }
  if (!hasOpenRouterApiKey()) {
    return res.status(503).json({ error: "AI service is not configured." });
  }
  next();
}

router.get("/status", (req, res) => {
  const enabled =
    process.env.ENABLE_AI !== "false" && hasOpenRouterApiKey();
  res.json({ enabled });
});

router.use(aiGuard);

// POST /api/ai/explain
router.post("/explain", async (req, res) => {
  const { code, language } = req.body;
  const err = validateCode(code);
  if (err) return res.status(400).json({ error: err });

  try {
    const completion = await createChatCompletion({
      messages: [
        { role: "system", content: ACTION_PROMPTS.explain },
        { role: "user", content: buildCodeContextMessage({ code, language }) },
      ],
    });
    res.json({ explanation: extractAssistantText(completion) });
  } catch (error) {
    handleAIError(error, res);
  }
});

// POST /api/ai/fix
router.post("/fix", async (req, res) => {
  const { code, language, error: codeError } = req.body;
  const err = validateCode(code);
  if (err) return res.status(400).json({ error: err });

  try {
    const userContent = buildCodeContextMessage({
      code,
      language,
      instructions: codeError ? `Error encountered: ${codeError}` : undefined,
    });
    const completion = await createChatCompletion({
      messages: [
        { role: "system", content: ACTION_PROMPTS.fix },
        { role: "user", content: userContent },
      ],
    });
    const text = extractAssistantText(completion);
    res.json({ fixedCode: text, diffSummary: text });
  } catch (error) {
    handleAIError(error, res);
  }
});

// POST /api/ai/optimize
router.post("/optimize", async (req, res) => {
  const { code, language } = req.body;
  const err = validateCode(code);
  if (err) return res.status(400).json({ error: err });

  try {
    const completion = await createChatCompletion({
      messages: [
        { role: "system", content: ACTION_PROMPTS.optimize },
        { role: "user", content: buildCodeContextMessage({ code, language }) },
      ],
    });
    const text = extractAssistantText(completion);
    res.json({ optimizedCode: text, notes: text });
  } catch (error) {
    handleAIError(error, res);
  }
});

// POST /api/ai/generate
router.post("/generate", async (req, res) => {
  const { description, language } = req.body;
  if (typeof description !== "string" || description.trim().length === 0) {
    return res.status(400).json({ error: "description must be a non-empty string." });
  }

  try {
    const completion = await createChatCompletion({
      messages: [
        { role: "system", content: ACTION_PROMPTS.generate },
        { role: "user", content: `Language: ${language || "plaintext"}\nDescription: ${description}` },
      ],
    });
    res.json({ code: extractAssistantText(completion) });
  } catch (error) {
    handleAIError(error, res);
  }
});

// POST /api/ai/comment
router.post("/comment", async (req, res) => {
  const { code, language } = req.body;
  const err = validateCode(code);
  if (err) return res.status(400).json({ error: err });

  try {
    const completion = await createChatCompletion({
      messages: [
        { role: "system", content: ACTION_PROMPTS.comment },
        { role: "user", content: buildCodeContextMessage({ code, language }) },
      ],
    });
    res.json({ commentedCode: extractAssistantText(completion) });
  } catch (error) {
    handleAIError(error, res);
  }
});

// POST /api/ai/convert
router.post("/convert", async (req, res) => {
  const { code, fromLanguage, toLanguage } = req.body;
  const err = validateCode(code);
  if (err) return res.status(400).json({ error: err });

  if (!toLanguage) {
    return res.status(400).json({ error: "toLanguage is required." });
  }

  try {
    const userContent = [
      `Source language: ${fromLanguage || "auto-detect"}`,
      `Target language: ${toLanguage}`,
      "Code:",
      "```",
      code,
      "```",
    ].join("\n");

    const completion = await createChatCompletion({
      messages: [
        { role: "system", content: ACTION_PROMPTS.convert },
        { role: "user", content: userContent },
      ],
    });
    res.json({ convertedCode: extractAssistantText(completion) });
  } catch (error) {
    handleAIError(error, res);
  }
});

// POST /api/ai/explain-error
router.post("/explain-error", async (req, res) => {
  const { code, language, errorOutput } = req.body;
  const err = validateCode(code);
  if (err) return res.status(400).json({ error: err });

  try {
    const userContent = buildCodeContextMessage({
      code,
      language,
      instructions: errorOutput ? `Error output:\n${errorOutput}` : undefined,
    });
    const completion = await createChatCompletion({
      messages: [
        { role: "system", content: ACTION_PROMPTS.explainError },
        { role: "user", content: userContent },
      ],
    });
    const text = extractAssistantText(completion);
    res.json({ explanation: text, suggestedFix: text });
  } catch (error) {
    handleAIError(error, res);
  }
});

// POST /api/ai/review
router.post("/review", async (req, res) => {
  const { code, language } = req.body;
  const err = validateCode(code);
  if (err) return res.status(400).json({ error: err });

  try {
    const completion = await createChatCompletion({
      messages: [
        { role: "system", content: ACTION_PROMPTS.review },
        { role: "user", content: buildCodeContextMessage({ code, language }) },
      ],
    });
    res.json({ review: extractAssistantText(completion) });
  } catch (error) {
    handleAIError(error, res);
  }
});

// POST /api/ai/debug
router.post("/debug", async (req, res) => {
  const { code, language } = req.body;
  const err = validateCode(code);
  if (err) return res.status(400).json({ error: err });

  try {
    const completion = await createChatCompletion({
      messages: [
        { role: "system", content: ACTION_PROMPTS.debug },
        { role: "user", content: buildCodeContextMessage({ code, language }) },
      ],
    });
    const text = extractAssistantText(completion);
    res.json({ analysis: text, suggestedFix: text });
  } catch (error) {
    handleAIError(error, res);
  }
});

export default router;
