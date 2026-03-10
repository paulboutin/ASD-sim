export interface SymbolItem {
  label: string;
  icon: string;
}

export const SYMBOL_ITEMS: SymbolItem[] = [
  { label: 'yes', icon: 'yes.svg' },
  { label: 'no', icon: 'no.svg' },
  { label: 'help', icon: 'help.svg' },
  { label: 'more', icon: 'more.svg' },
  { label: 'water', icon: 'water.svg' },
  { label: 'break', icon: 'break.svg' },
  { label: 'food', icon: 'food.svg' },
  { label: 'home', icon: 'home.svg' },
  { label: 'school', icon: 'school.svg' },
  { label: 'thank you', icon: 'thank-you.svg' },
  { label: 'all done', icon: 'all-done.svg' },
  { label: 'friend', icon: 'friend.svg' },
];

export function iconUrl(icon: string): string {
  return `${import.meta.env.BASE_URL}icons/${icon}`;
}
