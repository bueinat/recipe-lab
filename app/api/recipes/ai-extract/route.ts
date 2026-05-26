import { NextResponse } from "next/server";
import {
  AI_RECIPE_EXTRACTION_SCHEMA,
  sanitizeAiRecipeExtraction,
} from "@/lib/recipe-extraction";
import { preprocessRecipeImportText } from "@/lib/recipe-import-preprocessing";

export const runtime = "nodejs";

const OPENAI_MODEL = "gpt-5.4-mini";
const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const AI_TIMEOUT_MS = 20000;

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "AI recipe extraction requires API setup. Add OPENAI_API_KEY to .env.local and restart the server.",
      },
      { status: 503 },
    );
  }

  const requestBody = await parseJsonBody(request);
  const pastedText = getStringField(requestBody, "pastedText");

  if (!pastedText.trim()) {
    return NextResponse.json(
      { error: "Paste recipe text before running AI extraction." },
      { status: 400 },
    );
  }

  const preprocessing = preprocessRecipeImportText(pastedText);

  if (preprocessing.aiInputText.length < 20) {
    return NextResponse.json(
      {
        error:
          "There is not enough recipe text for AI extraction. Add more pasted text and try again.",
      },
      { status: 400 },
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
            content:
              "Extract a recipe from cleaned user text. Return strict JSON only. Use empty fields and warnings instead of inventing missing details. If the recipe has named parts like Dough, Filling, Sauce, קלתית, מילוי, or רויאל, return ingredientSections and instructionSections. For simple recipes, return empty section arrays and use the flat ingredients and instructions arrays.",
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
        max_output_tokens: 1600,
        text: {
          format: {
            type: "json_schema",
            name: "recipe_extraction",
            strict: true,
            schema: AI_RECIPE_EXTRACTION_SCHEMA,
          },
        },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            "AI extraction could not run right now. Try again later.",
        },
        { status: response.status >= 500 ? 502 : response.status },
      );
    }

    const responseBody = await response.json();
    const refusal = getResponseRefusal(responseBody);

    if (refusal) {
      return NextResponse.json(
        {
          error:
            "AI extraction could not safely extract this text. Review the pasted text and try again.",
        },
        { status: 422 },
      );
    }

    const outputText = getResponseOutputText(responseBody);

    if (!outputText) {
      return NextResponse.json(
        {
          error:
            "AI extraction returned an empty response. Try again.",
        },
        { status: 502 },
      );
    }

    const parsedOutput = JSON.parse(outputText) as unknown;
    const extraction = sanitizeAiRecipeExtraction(parsedOutput);

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

    return NextResponse.json(
      {
        error: isTimeout
          ? "AI extraction timed out. Try again."
          : "AI extraction returned invalid JSON. Try again.",
      },
      { status: isTimeout ? 504 : 502 },
    );
  } finally {
    clearTimeout(timeout);
  }
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

  if (typeof value.output_text === "string") {
    return value.output_text;
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
      if (
        isRecord(content) &&
        content.type === contentType &&
        typeof content.text === "string"
      ) {
        return content.text;
      }

      if (
        isRecord(content) &&
        content.type === contentType &&
        typeof content.refusal === "string"
      ) {
        return content.refusal;
      }
    }
  }

  return "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
