import { createTheme, darkThemeBase } from "webiny/admin/configs";

/** Tokyo Night (blue accent). */
export const tokyoNight = createTheme({
    id: "tokyo-night",
    name: "Tokyo Night",
    variables: {
        ...darkThemeBase,
        "--color-neutral-0": "#ffffff",
        "--color-neutral-50": "#d5dbf5",
        "--color-neutral-100": "#c0caf5",
        "--color-neutral-200": "#b3bcec",
        "--color-neutral-300": "#9aa5ce",
        "--color-neutral-400": "#737aa2",
        "--color-neutral-500": "#565f89",
        "--color-neutral-600": "#414868",
        "--color-neutral-700": "#2f344d",
        "--color-neutral-800": "#24283b",
        "--color-neutral-900": "#1a1b26",
        "--color-primary-100": "#eaf1fe",
        "--color-primary-200": "#d3e0fd",
        "--color-primary-300": "#b5cbfb",
        "--color-primary-400": "#97b6f9",
        "--color-primary-500": "#7aa2f7",
        "--color-primary-600": "#6a93f0",
        "--color-primary-700": "#5a84e8",
        "--color-primary-800": "#4a6fc9",
        "--color-primary-900": "#344e91"
    }
});
