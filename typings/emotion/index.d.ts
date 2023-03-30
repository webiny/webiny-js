import {Theme as WTheme} from "../../packages/theme/src/types";

declare module "@emotion/react" {
    // Ignoring "@typescript-eslint/no-empty-interface" rule here.
    // eslint-disable-next-line
    export interface Theme extends WTheme {
    }
}
