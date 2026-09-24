export const WAKE_WORD = "ultron";

export type OpenTarget = "google" | "youtube" | "github" | "gmail" | "maps" | "whatsapp" | "instagram";

export type VoiceCommand =
  | { type: "open"; target: OpenTarget; label: string }
  | { type: "zoom-in" }
  | { type: "zoom-out" }
  | { type: "reset" }
  | { type: "gestures"; enabled: boolean }
  | { type: "help" }
  | { type: "unknown" };

const OPEN_TARGETS: Record<string, { target: OpenTarget; label: string }> = {
  google: { target: "google", label: "Google" },
  "google chrome": { target: "google", label: "Google" },
  youtube: { target: "youtube", label: "YouTube" },
  github: { target: "github", label: "GitHub" },
  gmail: { target: "gmail", label: "Gmail" },
  maps: { target: "maps", label: "Google Maps" },
  whatsapp: { target: "whatsapp", label: "WhatsApp" },
  instagram: { target: "instagram", label: "Instagram" },
};

export function hasWakeWord(transcript: string) {
  return new RegExp(`\\b${WAKE_WORD}\\b`, "i").test(transcript);
}

export function stripWakeWord(transcript: string) {
  return transcript
    .replace(new RegExp(`\\b${WAKE_WORD}\\b[,:]?\\s*`, "gi"), "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseVoiceCommand(transcript: string): VoiceCommand {
  const text = stripWakeWord(transcript).toLowerCase().replace(/[.!?]+$/, "").trim();

  if (!text) return { type: "unknown" };

  for (const [name, entry] of Object.entries(OPEN_TARGETS)) {
    if (text === name || text.includes(`open ${name}`) || text.includes(`launch ${name}`) || text.includes(`start ${name}`)) {
      return { type: "open", ...entry };
    }
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
  if (/\b(help|what can you do|commands)\b/.test(text)) return { type: "help" };

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

export function openSafeTarget(target: OpenTarget) {
  if (typeof window === "undefined") return;

  const urls: Record<OpenTarget, string> = {
    google: "https://www.google.com",
    youtube: "https://www.youtube.com",
    github: "https://github.com",
    gmail: "https://mail.google.com",
    maps: "https://maps.google.com",
    whatsapp: "https://web.whatsapp.com",
    instagram: "https://www.instagram.com",
  } as const;

  const newTab = window.open(urls[target], "_blank", "noopener,noreferrer");
  if (!newTab) window.location.assign(urls[target]);
}

