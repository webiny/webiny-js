import { createTheme, darkThemeBase } from "webiny/admin/configs";

/**
 * Webiny Dark — the original dark theme. It applies only the shared dark mapping and keeps
 * the default neutral ramp + orange accent from `@webiny/admin-ui`.
 */
export const webinyDark = createTheme({
    id: "webiny-dark",
    name: "Webiny Dark",
    variables: {
        ...darkThemeBase
    }
});
