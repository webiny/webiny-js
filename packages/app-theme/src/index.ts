import { Plugin } from "@webiny/plugins";
import { DecoratedTheme } from "@webiny/theme/types";

export class ThemePlugin extends Plugin {
    public static override readonly type: string = "theme";
    public readonly theme: DecoratedTheme;

    public constructor(theme: DecoratedTheme) {
        super();
        this.theme = theme;
    }
}

export * from "@webiny/theme";
