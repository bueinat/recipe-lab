import { NextResponse } from "next/server";
import {
  AI_RECIPE_EXTRACTION_SCHEMA,
  sanitizeAiRecipeExtraction,
} from "@/lib/recipe-extraction";
import { preprocessRecipeText } from "@/lib/local-recipe-extraction";

export const runtime = "nodejs";

const OPENAI_MODEL = "gpt-5.4-mini";
const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const MAX_AI_INPUT_CHARACTERS = 12000;
const AI_TIMEOUT_MS = 20000;

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "AI extraction is optional and is not configured yet. Add OPENAI_API_KEY to .env.local and restart the server, or keep using the local draft.",
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

  const { cleanedText, languageHint } = preprocessRecipeText(pastedText);

  if (cleanedText.length < 20) {
    return NextResponse.json(
      {
        error:
          "There is not enough recipe text for AI extraction. Add more pasted text or keep editing the local draft.",
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
              "Extract a recipe from cleaned user text. Return strict JSON only. Use empty fields and warnings instead of inventing missing details.",
          },
          {
            role: "user",
            content: `Language hint: ${languageHint}\n\nCleaned recipe text:\n${cleanedText.slice(
              0,
              MAX_AI_INPUT_CHARACTERS,
            )}`,
          },
        ],
        max_output_tokens: 1200,
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
            "AI extraction could not run right now. Keep using the local draft or try again later.",
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
            "AI extraction could not safely extract this text. Keep using the local draft.",
        },
        { status: 422 },
      );
    }

    const outputText = getResponseOutputText(responseBody);

    if (!outputText) {
      return NextResponse.json(
        {
          error:
            "AI extraction returned an empty response. Keep using the local draft or try again.",
        },
        { status: 502 },
      );
    }

    const parsedOutput = JSON.parse(outputText) as unknown;
    const extraction = sanitizeAiRecipeExtraction(parsedOutput);

    return NextResponse.json({
      extraction,
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
          ? "AI extraction timed out. Keep using the local draft or try again."
          : "AI extraction returned invalid JSON. Keep using the local draft or try again.",
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
