import { createTheme, darkThemeBase } from "webiny/admin/configs";

/** Dracula — https://draculatheme.com (purple accent). */
export const dracula = createTheme({
    id: "dracula",
    name: "Dracula",
    variables: {
        ...darkThemeBase,
        "--color-neutral-0": "#ffffff",
        "--color-neutral-50": "#fbfbf9",
        "--color-neutral-100": "#f8f8f2",
        "--color-neutral-200": "#d3d7eb",
        "--color-neutral-300": "#a9b2d8",
        "--color-neutral-400": "#7d88b8",
        "--color-neutral-500": "#6272a4",
        "--color-neutral-600": "#565a72",
        "--color-neutral-700": "#44475a",
        "--color-neutral-800": "#343746",
        "--color-neutral-900": "#282a36",
        "--color-primary-100": "#f1e9fe",
        "--color-primary-200": "#e4d3fd",
        "--color-primary-300": "#d6bcfc",
        "--color-primary-400": "#cba8fb",
        "--color-primary-500": "#bd93f9",
        "--color-primary-600": "#ab7ff5",
        "--color-primary-700": "#9a6bf0",
        "--color-primary-800": "#8257d4",
        "--color-primary-900": "#5d3f99"
    }
});
