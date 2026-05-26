import { NextResponse } from "next/server";
import {
  AI_RECIPE_EXTRACTION_SCHEMA,
  sanitizeAiRecipeExtraction,
} from "@/lib/recipe-extraction";
import { preprocessRecipeImportText } from "@/lib/recipe-import-preprocessing";

export const runtime = "nodejs";

const OPENAI_MODEL = "gpt-5.4-mini";
const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const AI_TIMEOUT_MS = 30000;
const FRIENDLY_STRUCTURE_ERROR =
  "AI could not structure this recipe. You can try again or edit the local draft manually.";
const SECTION_EXAMPLES = [
  "Dough",
  "Filling",
  "Sauce",
  "\u05dc\u05d1\u05e1\u05d9\u05e1 \u05d1\u05d9\u05e1\u05e7\u05d5\u05d5\u05d9\u05d8\u05d9\u05dd",
  "\u05dc\u05de\u05dc\u05d9\u05ea \u05d2\u05d1\u05d9\u05e0\u05d4",
  "\u05dc\u05e7\u05e8\u05dd \u05dc\u05d9\u05de\u05d5\u05df",
  "\u05dc\u05de\u05e8\u05e0\u05d2",
  "\u05d1\u05e1\u05d9\u05e1 \u05d1\u05d9\u05e1\u05e7\u05d5\u05d5\u05d9\u05d8\u05d9\u05dd",
  "\u05de\u05dc\u05d9\u05ea \u05d2\u05d1\u05d9\u05e0\u05d4",
  "\u05e7\u05e8\u05dd \u05dc\u05d9\u05de\u05d5\u05df",
  "\u05de\u05e8\u05e0\u05d2 \u05e9\u05d5\u05d5\u05d9\u05e6\u05e8\u05d9",
].join(", ");
const RECIPE_EXTRACTION_INSTRUCTIONS = [
  "Extract a recipe from cleaned user text.",
  "The response must match the supplied JSON schema.",
  "Use empty fields and warnings instead of inventing missing details.",
  "AI is responsible for title, ingredients, instructions, notes, servings, tags, languageHint, confidence, and warnings.",
  `When named recipe parts appear, such as ${SECTION_EXAMPLES}, preserve those headings exactly and return ingredientSections and instructionSections.`,
  "For simple recipes, return empty section arrays and use the flat ingredients and instructions arrays.",
].join(" ");

type AiExtractionErrorCode =
  | "missing_api_key"
  | "empty_input"
  | "too_short"
  | "openai_request_failed"
  | "model_refusal"
  | "empty_response"
  | "invalid_structured_output"
  | "timeout";

type SafeLogDetails = Record<string, string | number | boolean | undefined>;

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return jsonError(
      "missing_api_key",
      "AI recipe extraction requires API setup. Add OPENAI_API_KEY to .env.local and restart the server.",
      503,
    );
  }

  const requestBody = await parseJsonBody(request);
  const pastedText = getStringField(requestBody, "pastedText");

  if (!pastedText.trim()) {
    return jsonError(
      "empty_input",
      "Paste recipe text before running AI extraction.",
      400,
    );
  }

  const preprocessing = preprocessRecipeImportText(pastedText);

  if (preprocessing.aiInputText.length < 20) {
    return jsonError(
      "too_short",
      "There is not enough recipe text for AI extraction. Add more pasted text and try again.",
      400,
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

  try {
    const response = await fetch(OPENAI_RESPONSES_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        input: [
          {
            role: "system",
            content: RECIPE_EXTRACTION_INSTRUCTIONS,
          },
          {
            role: "user",
            content: [
              `Language hint: ${preprocessing.languageHint}`,
              `Detected source URL: ${preprocessing.detectedSourceUrl || "none"}`,
              `Optional section heading hints: ${
                preprocessing.sectionHints.join(", ") || "none"
              }`,
              "",
              "Cleaned recipe text:",
              preprocessing.aiInputText,
            ].join("\n"),
          },
        ],
        max_output_tokens: 10000,
        text: {
          format: {
            type: "json_schema",
            name: "recipe_extraction",
            description:
              "Structured recipe extraction with optional sectioned ingredients and instructions.",
            strict: true,
            schema: AI_RECIPE_EXTRACTION_SCHEMA,
          },
        },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      logAiExtractionIssue("openai_request_failed", {
        status: response.status,
        statusText: response.statusText,
      });

      return jsonError(
        "openai_request_failed",
        "AI extraction could not run right now. Try again later.",
        response.status >= 500 ? 502 : response.status,
      );
    }

    let responseBody: unknown;

    try {
      responseBody = await response.json();
    } catch (error) {
      logAiExtractionIssue("openai_request_failed", {
        reason: getSafeErrorReason(error),
      });

      return jsonError(
        "openai_request_failed",
        "AI extraction could not run right now. Try again later.",
        502,
      );
    }

    const refusal = getResponseRefusal(responseBody);

    if (refusal) {
      logAiExtractionIssue("model_refusal", {
        responseId: getResponseStringField(responseBody, "id"),
        status: getResponseStringField(responseBody, "status"),
      });

      return jsonError(
        "model_refusal",
        "AI extraction could not safely extract this text. Review the pasted text and try again.",
        422,
      );
    }

    const outputText = getResponseOutputText(responseBody);

    if (!outputText) {
      logAiExtractionIssue("empty_response", {
        responseId: getResponseStringField(responseBody, "id"),
        status: getResponseStringField(responseBody, "status"),
        incompleteReason: getResponseIncompleteReason(responseBody),
      });

      return jsonError("empty_response", FRIENDLY_STRUCTURE_ERROR, 502);
    }

    const parsedOutput = parseStructuredJson(outputText);

    if ("error" in parsedOutput) {
      logAiExtractionIssue("invalid_structured_output", {
        reason: parsedOutput.error,
        outputLength: parsedOutput.outputLength,
        responseId: getResponseStringField(responseBody, "id"),
        status: getResponseStringField(responseBody, "status"),
        incompleteReason: getResponseIncompleteReason(responseBody),
      });

      return jsonError(
        "invalid_structured_output",
        FRIENDLY_STRUCTURE_ERROR,
        502,
      );
    }

    const extraction = sanitizeAiRecipeExtraction(parsedOutput.value);

    return NextResponse.json({
      extraction,
      preprocessing: {
        detectedSourceUrl: preprocessing.detectedSourceUrl,
        inputCharacterLimit: preprocessing.inputCharacterLimit,
        removedLineCount: preprocessing.removedLineCount,
        sentCharacterCount: preprocessing.aiInputText.length,
        wasTruncated: preprocessing.wasTruncated,
      },
      model: OPENAI_MODEL,
      source: "ai",
    });
  } catch (error) {
    const isTimeout =
      error instanceof Error &&
      (error.name === "AbortError" || error.message.includes("aborted"));

    logAiExtractionIssue(isTimeout ? "timeout" : "openai_request_failed", {
      reason: getSafeErrorReason(error),
    });

    return jsonError(
      isTimeout ? "timeout" : "openai_request_failed",
      isTimeout
        ? "AI extraction timed out. Try again."
        : "AI extraction could not run right now. Try again later.",
      isTimeout ? 504 : 502,
    );
  } finally {
    clearTimeout(timeout);
  }
}

function jsonError(
  code: AiExtractionErrorCode,
  message: string,
  status: number,
) {
  return NextResponse.json(
    {
      error: {
        code,
        message,
      },
    },
    { status },
  );
}

async function parseJsonBody(request: Request) {
  try {
    const body = (await request.json()) as unknown;

    return isRecord(body) ? body : {};
  } catch {
    return {};
  }
}

function getStringField(record: Record<string, unknown>, field: string) {
  const value = record[field];

  return typeof value === "string" ? value : "";
}

function getResponseOutputText(value: unknown) {
  if (!isRecord(value)) {
    return "";
  }

  if (typeof value.output_text === "string" && value.output_text.trim()) {
    return value.output_text.trim();
  }

  return getResponseContentText(value, "output_text");
}

function getResponseRefusal(value: unknown) {
  if (!isRecord(value)) {
    return "";
  }

  return getResponseContentText(value, "refusal");
}

function getResponseContentText(value: Record<string, unknown>, contentType: string) {
  const output = value.output;

  if (!Array.isArray(output)) {
    return "";
  }

  for (const item of output) {
    if (!isRecord(item) || !Array.isArray(item.content)) {
      continue;
    }

    for (const content of item.content) {
      if (isRecord(content) && content.type === contentType) {
        if (typeof content.text === "string") {
          return content.text.trim();
        }

        if (typeof content.refusal === "string") {
          return content.refusal.trim();
        }
      }

      if (
        isRecord(content) &&
        contentType === "output_text" &&
        content.type === "text" &&
        typeof content.text === "string"
      ) {
        return content.text.trim();
      }
    }
  }

  return "";
}

function parseStructuredJson(outputText: string):
  | { value: unknown }
  | { error: string; outputLength: number } {
  const trimmedOutput = outputText.trim();

  try {
    return { value: JSON.parse(trimmedOutput) as unknown };
  } catch (error) {
    const jsonObjectText = extractJsonObjectText(trimmedOutput);

    if (jsonObjectText && jsonObjectText !== trimmedOutput) {
      try {
        return { value: JSON.parse(jsonObjectText) as unknown };
      } catch (repairError) {
        return {
          error: getSafeErrorReason(repairError),
          outputLength: trimmedOutput.length,
        };
      }
    }

    return {
      error: getSafeErrorReason(error),
      outputLength: trimmedOutput.length,
    };
  }
}

function extractJsonObjectText(value: string) {
  const objectStart = value.indexOf("{");
  const objectEnd = value.lastIndexOf("}");

  if (objectStart === -1 || objectEnd <= objectStart) {
    return "";
  }

  return value.slice(objectStart, objectEnd + 1);
}

function getResponseStringField(value: unknown, field: string) {
  if (!isRecord(value)) {
    return undefined;
  }

  const fieldValue = value[field];

  return typeof fieldValue === "string" ? fieldValue : undefined;
}

function getResponseIncompleteReason(value: unknown) {
  if (!isRecord(value) || !isRecord(value.incomplete_details)) {
    return undefined;
  }

  const reason = value.incomplete_details.reason;

  return typeof reason === "string" ? reason : undefined;
}

function logAiExtractionIssue(
  reason: AiExtractionErrorCode,
  details: SafeLogDetails = {},
) {
  console.warn("AI recipe extraction issue", {
    reason,
    ...details,
  });
}

function getSafeErrorReason(error: unknown) {
  if (!(error instanceof Error)) {
    return "Unknown error";
  }

  return error.message
    .replace(/"(?:[^"\\]|\\.){16,}"/g, '"[redacted]"')
    .slice(0, 160);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
