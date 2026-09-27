// Text-to-speech helper using the Web Speech API.
// Falls back gracefully with a status callback if unsupported.

export type SpeakLang = "ja-JP" | "en-US";

export function isTTSSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function speak(text: string, lang: SpeakLang, onError?: (msg: string) => void) {
  if (!text || !text.trim()) return;
  if (!isTTSSupported()) {
    onError?.("Text-to-speech isn't supported on this device.");
    return;
  }
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.95;
    const voices = window.speechSynthesis.getVoices();
    const match = voices.find((v) => v.lang === lang) || voices.find((v) => v.lang.startsWith(lang.slice(0, 2)));
    if (match) utterance.voice = match;
    else if (voices.length > 0) {
      onError?.(`No ${lang} voice found on this device — using default voice.`);
    }
    utterance.onerror = () => onError?.("Couldn't play pronunciation for this card.");
    window.speechSynthesis.speak(utterance);
  } catch {
    onError?.("Couldn't play pronunciation for this card.");
  }
}

// Some browsers load voices asynchronously; warm them up once.
export function primeVoices() {
  if (!isTTSSupported()) return;
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
}
