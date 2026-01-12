interface TelegramWebApp {
  ready(): void;
  expand(): void;
  themeParams: {
    bg_color: string;
    text_color: string;
    hint_color?: string;
    link_color?: string;
    button_color?: string;
    button_text_color?: string;
  };
  MainButton: {
    setText(text: string): void;
    show(): void;
    hide(): void;
    onClick(callback: () => void): void;
    offClick(): void;
  };
  initData?: string;
  initDataUnsafe?: any;
  setBackgroundColor(color: string): void;
  setHeaderColor(color: string): void;
}

interface Window {
  Telegram?: {
    WebApp: TelegramWebApp;
  };
}