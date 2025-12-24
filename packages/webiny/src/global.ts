/**
 * Global type augmentations for Webiny.
 * This file is automatically included in any TypeScript project that uses Webiny.
 *
 * This file ensures all type augmentations are loaded without requiring explicit imports.
 */
import "@webiny/tasks/global.js";

declare module "*.png" {
    const png: string;
    export default png;
}

declare module "*.jpg" {
    const jpg: string;
    export default jpg;
}

declare module "*.svg" {
    import { FunctionComponent, SVGProps } from "react";

    export const ReactComponent: FunctionComponent<
        SVGProps<SVGSVGElement> & {
            alt?: string;
        }
    >;

    const src: string;
    export default src;
}
