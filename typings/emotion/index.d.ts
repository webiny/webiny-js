import { Theme as WTheme } from "@webiny/theme/types";

declare module "@emotion/react" {
    // Ignoring "@typescript-eslint/no-empty-interface" rule here.
    // eslint-disable-next-line
    export interface Theme extends WTheme {}
}
