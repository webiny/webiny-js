import { createTheme, darkThemeBase } from "webiny/admin/configs";

/** GitHub Dark (blue accent). */
export const githubDark = createTheme({
    id: "github-dark",
    name: "GitHub Dark",
    variables: {
        ...darkThemeBase,
        "--color-neutral-0": "#ffffff",
        "--color-neutral-50": "#e6edf3",
        "--color-neutral-100": "#c9d1d9",
        "--color-neutral-200": "#b1bac4",
        "--color-neutral-300": "#8b949e",
        "--color-neutral-400": "#768390",
        "--color-neutral-500": "#586069",
        "--color-neutral-600": "#444c56",
        "--color-neutral-700": "#30363d",
        "--color-neutral-800": "#161b22",
        "--color-neutral-900": "#0d1117",
        "--color-primary-100": "#e8f1ff",
        "--color-primary-200": "#cce0ff",
        "--color-primary-300": "#a5cdff",
        "--color-primary-400": "#79b8ff",
        "--color-primary-500": "#58a6ff",
        "--color-primary-600": "#4496f7",
        "--color-primary-700": "#388bfd",
        "--color-primary-800": "#2f7ce0",
        "--color-primary-900": "#1f5fb0"
    }
});
