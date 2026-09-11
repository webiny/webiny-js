import { createTheme, darkThemeBase } from "webiny/admin/configs";

/** One Dark Pro (blue accent). */
export const oneDarkPro = createTheme({
    id: "one-dark-pro",
    name: "One Dark Pro",
    variables: {
        ...darkThemeBase,
        "--color-neutral-0": "#ffffff",
        "--color-neutral-50": "#eef0f3",
        "--color-neutral-100": "#dfe3eb",
        "--color-neutral-200": "#c8cdd6",
        "--color-neutral-300": "#abb2bf",
        "--color-neutral-400": "#828997",
        "--color-neutral-500": "#5c6370",
        "--color-neutral-600": "#4b5263",
        "--color-neutral-700": "#3b4048",
        "--color-neutral-800": "#2c313a",
        "--color-neutral-900": "#282c34",
        "--color-primary-100": "#e8f4fd",
        "--color-primary-200": "#cce5fb",
        "--color-primary-300": "#a6d2f6",
        "--color-primary-400": "#82c0f2",
        "--color-primary-500": "#61afef",
        "--color-primary-600": "#4fa1ec",
        "--color-primary-700": "#3d93e8",
        "--color-primary-800": "#2f7ec9",
        "--color-primary-900": "#225a91"
    }
});
