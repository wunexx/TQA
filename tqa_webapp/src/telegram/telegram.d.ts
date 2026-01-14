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
    secondary_bg_color?: string;
    header_bg_color?: string;
    bottom_bar_bg_color?: string;
    accent_text_color?: string;
    section_bg_color?: string;
    section_header_text_color?: string;
    section_separator_color?: string;
    subtitle_text_color?: string;
    destructive_text_color?: string;
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

  version?: string;

  setBackgroundColor(color: string): void;
  setHeaderColor(color: string): void;
}

interface Window {
  Telegram?: {
    WebApp: TelegramWebApp;
  };
}
