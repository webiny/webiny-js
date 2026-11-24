import type { Theme } from "./types.js";

/**
 * The built-in default theme. It applies no variable overrides, so the default `@theme`
 * (light) palette from `@webiny/admin-ui` is used. Always available in the switcher and used
 * whenever no (or an unknown) theme is stored in local storage.
 */
export const lightTheme: Theme = {
    id: "light",
    name: "Webiny Light",
    variables: {}
};
