const baseUrl = import.meta.env.BASE_URL.endsWith('/')
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`;

function clipPath(filename: string): string {
  return `${baseUrl}audio/${filename}`;
}

const symbolPromptAudio: Record<string, string> = {
  'all done': clipPath('prompt-symbol-all-done.mp3'),
  break: clipPath('prompt-symbol-break.mp3'),
  food: clipPath('prompt-symbol-food.mp3'),
  friend: clipPath('prompt-symbol-friend.mp3'),
  help: clipPath('prompt-symbol-help.mp3'),
  home: clipPath('prompt-symbol-home.mp3'),
  more: clipPath('prompt-symbol-more.mp3'),
  no: clipPath('prompt-symbol-no.mp3'),
  school: clipPath('prompt-symbol-school.mp3'),
  snack: clipPath('prompt-symbol-snack.mp3'),
  'thank you': clipPath('prompt-symbol-thank-you.mp3'),
  water: clipPath('prompt-symbol-water.mp3'),
  yes: clipPath('prompt-symbol-yes.mp3'),
};

const colorPromptAudio: Record<string, string> = {
  blue: clipPath('prompt-color-blue.mp3'),
  green: clipPath('prompt-color-green.mp3'),
  orange: clipPath('prompt-color-orange.mp3'),
  purple: clipPath('prompt-color-purple.mp3'),
  red: clipPath('prompt-color-red.mp3'),
  yellow: clipPath('prompt-color-yellow.mp3'),
};

const recognitionPromptAudio: Record<string, string> = {
  'blue-square': clipPath('prompt-recognition-blue-square.mp3'),
  'green-circle': clipPath('prompt-recognition-green-circle.mp3'),
  'green-triangle': clipPath('prompt-recognition-green-triangle.mp3'),
  'orange-circle': clipPath('prompt-recognition-orange-circle.mp3'),
  'purple-diamond': clipPath('prompt-recognition-purple-diamond.mp3'),
  'red-diamond': clipPath('prompt-recognition-red-diamond.mp3'),
  'red-triangle': clipPath('prompt-recognition-red-triangle.mp3'),
};

const focusPromptAudio: Record<string, string> = {
  continue: clipPath('prompt-focus-continue.mp3'),
  'need-break': clipPath('prompt-focus-need-break.mp3'),
  pause: clipPath('prompt-focus-pause.mp3'),
  'ready-attention': clipPath('prompt-focus-ready-attention.mp3'),
};

export const feedbackAudio = {
  correct: clipPath('feedback-thats-right.mp3'),
  encouraging: clipPath('feedback-good.mp3'),
  incorrect: clipPath('feedback-no-try-again.mp3'),
} as const;

export const feedbackAudioDelayMs = {
  correct: 2200,
  incorrect: 3300,
} as const;

export function getSymbolPromptAudio(label: string): string | null {
  return symbolPromptAudio[label] ?? null;
}

export function getColorPromptAudio(name: string): string | null {
  return colorPromptAudio[name] ?? null;
}

export function getRecognitionPromptAudio(id: string): string | null {
  return recognitionPromptAudio[id] ?? null;
}

export function getFocusPromptAudio(id: string): string | null {
  return focusPromptAudio[id] ?? null;
}
