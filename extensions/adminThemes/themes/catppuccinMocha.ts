import { createTheme, darkThemeBase } from "webiny/admin/configs";

/** Catppuccin Mocha — https://catppuccin.com (mauve accent). */
export const catppuccinMocha = createTheme({
    id: "catppuccin-mocha",
    name: "Catppuccin Mocha",
    variables: {
        ...darkThemeBase,
        "--color-neutral-0": "#ffffff",
        "--color-neutral-50": "#e0e5f7",
        "--color-neutral-100": "#cdd6f4",
        "--color-neutral-200": "#bac2de",
        "--color-neutral-300": "#9399b2",
        "--color-neutral-400": "#7f849c",
        "--color-neutral-500": "#6c7086",
        "--color-neutral-600": "#585b70",
        "--color-neutral-700": "#45475a",
        "--color-neutral-800": "#313244",
        "--color-neutral-900": "#1e1e2e",
        "--color-primary-100": "#f5eefe",
        "--color-primary-200": "#ecdefc",
        "--color-primary-300": "#e1cbfb",
        "--color-primary-400": "#d6b8f9",
        "--color-primary-500": "#cba6f7",
        "--color-primary-600": "#bd91f4",
        "--color-primary-700": "#af7cf0",
        "--color-primary-800": "#9560d6",
        "--color-primary-900": "#6b43a0"
    }
});
