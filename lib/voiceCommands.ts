export const WAKE_WORD = "ultron";

export type VoiceCommand =
  | { type: "open"; target: "google" | "youtube" | "github" | "gmail" | "docs" | "maps" }
  | { type: "math"; expression: string }
  | { type: "zoom-in" }
  | { type: "zoom-out" }
  | { type: "reset" }
  | { type: "gestures"; enabled: boolean }
  | { type: "help" }
  | { type: "unknown" };

const OPEN_TARGETS: Record<string, VoiceCommand> = {
  google: { type: "open", target: "google" },
  "google chrome": { type: "open", target: "google" },
  youtube: { type: "open", target: "youtube" },
  github: { type: "open", target: "github" },
  gmail: { type: "open", target: "gmail" },
  docs: { type: "open", target: "docs" },
  maps: { type: "open", target: "maps" },
};

export function evaluateMathExpression(expression: string) {
  const trimmed = expression.trim();
  if (!trimmed) return { ok: false };

  const rootMatch = trimmed.match(/(?:square root of|sqrt)\s*([0-9]+(?:\.\d+)?)/i);
  if (rootMatch) {
    const value = Number(rootMatch[1]);
    if (!Number.isNaN(value)) return { ok: true, result: Math.sqrt(value) };
  }

  const powerMatch = trimmed.match(/([0-9]+(?:\.\d+)?)\s*(?:to the power of|power)\s*([0-9]+(?:\.\d+)?)/i);
  if (powerMatch) {
    const left = Number(powerMatch[1]);
    const right = Number(powerMatch[2]);
    if (!Number.isNaN(left) && !Number.isNaN(right)) return { ok: true, result: Math.pow(left, right) };
  }

  const normalized = trimmed
    .toLowerCase()
    .replace(/what is|what's|calculate|compute|solve|equals|equal to/gi, " ")
    .replace(/\bplus\b/g, "+")
    .replace(/\bminus\b/g, "-")
    .replace(/\bmultiplied by\b/g, "*")
    .replace(/\btimes\b/g, "*")
    .replace(/\bdivided by\b/g, "/")
    .replace(/\bover\b/g, "/")
    .replace(/\bto the power of\b/g, "^")
    .replace(/\bpower\b/g, "^")
    .replace(/\bof\b/g, "")
    .replace(/x/g, "*")
    .replace(/\^/g, "**")
    .replace(/[^0-9+\-*/().% ]/g, "")
    .replace(/\s+/g, "")
    .replace(/\(\)/g, "");

  if (!normalized || /[+\-*/%]$/.test(normalized)) return { ok: false };

  try {
    const result = Function(`"use strict"; return (${normalized});`)();
    if (typeof result === "number" && Number.isFinite(result)) {
      return { ok: true, result: Number(result.toFixed(10)) };
    }
  } catch {
    return { ok: false };
  }

  return { ok: false };
}

export function hasWakeWord(transcript: string) {
  return new RegExp(`\\b${WAKE_WORD}\\b`, "i").test(transcript);
}

export function stripWakeWord(transcript: string) {
  return transcript
    .replace(new RegExp(`\\b${WAKE_WORD}\\b`, "gi"), "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseVoiceCommand(transcript: string): VoiceCommand {
  const text = stripWakeWord(transcript).toLowerCase();

  if (!text) return { type: "unknown" };

  for (const [target, command] of Object.entries(OPEN_TARGETS)) {
    if (text.includes(`open ${target}`) || text === target) return command;
  }

  if (/\b(?:what is|what's|calculate|compute|solve)\b/.test(text) && /[0-9]/.test(text)) {
    const expression = text.replace(/^(?:what is|what's|calculate|compute|solve)\s+/, "").replace(/\?+$/, "").trim();
    if (expression && /[0-9]/.test(expression)) return { type: "math", expression };
  }

  if (/[0-9]/.test(text) && /[+\-*/]/.test(text)) {
    return { type: "math", expression: text.replace(/\?+$/, "").trim() };
  }

  if (/\b(zoom in|zoom up|bigger)\b/.test(text)) return { type: "zoom-in" };
  if (/\b(zoom out|zoom down|smaller)\b/.test(text)) return { type: "zoom-out" };
  if (/\b(reset|reset view|home view)\b/.test(text)) return { type: "reset" };
  if (/\b(turn|switch|enable|start) (on )?(gestures|gesture control)\b/.test(text)) {
    return { type: "gestures", enabled: true };
  }
  if (/\b(turn|switch|disable|stop) (off )?(gestures|gesture control)\b/.test(text)) {
    return { type: "gestures", enabled: false };
  }
  if (/\b(help|what can you do|commands|voice commands)\b/.test(text)) return { type: "help" };
  return { type: "unknown" };
}

export function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1;
  utterance.pitch = 0.9;
  window.speechSynthesis.speak(utterance);
}

export function openSafeTarget(target: "google" | "youtube" | "github" | "gmail" | "docs" | "maps") {
  if (typeof window === "undefined") return;
  const urls = {
    google: "https://www.google.com",
    youtube: "https://www.youtube.com",
    github: "https://github.com",
    gmail: "https://mail.google.com",
    docs: "https://docs.google.com",
    maps: "https://www.google.com/maps",
  } as const;
  window.open(urls[target], "_blank", "noopener,noreferrer");
}
