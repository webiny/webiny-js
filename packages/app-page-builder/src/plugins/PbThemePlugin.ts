import { Plugin } from "@webiny/plugins";
import { Theme } from "@webiny/app-page-builder-theme/types";

export class PbThemePlugin extends Plugin {
    public static override readonly type: string = "pb-theme-object";
    public readonly theme: Theme;

    public constructor(theme: Theme) {
        super();
        this.theme = theme;
    }
}
