import { Plugin } from "@webiny/plugins";
import { Theme } from "@webiny/theme/types";

export class ThemePlugin extends Plugin {
    public static override readonly type: string = "theme";
    public readonly theme: Theme;

    public constructor(theme: Theme) {
        super();
        this.theme = theme;
    }
}

export * from "@webiny/theme";
// theme context
export { ThemeProvider } from "~/providers/ThemeProvider";
export { useTheme } from "~/hooks/useTheme";
