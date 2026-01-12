export function ApplyTelegramTheme(){
    const tg = window.Telegram?.WebApp;
    if(!tg) return;

    const t = tg.themeParams;

    const set = (name: string, value?: string) => {
        if(value)
            document.documentElement.style.setProperty(name, value);
    };

    set("--tg-bg", t.bg_color);
    set("--tg-text", t.text_color);
    set("--tg-hint", t.hint_color);
    set("--tg-link", t.link_color);
    set("--tg-button", t.button_color);
    set("--tg-button-text", t.button_text_color);

    tg.setBackgroundColor(t.bg_color);
    tg.setHeaderColor(t.bg_color);
}