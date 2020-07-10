// @ts-nocheck
declare module "*.md" {
    const md: string;
    export default md;
}

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

    export const ReactComponent: FunctionComponent<SVGProps<SVGSVGElement> & {
        alt?: string;
    }>;

    const src: string;
    export default src;
}

// Hot fix - check https://github.com/DefinitelyTyped/DefinitelyTyped/issues/45927 for a fix.
declare namespace NodeJS {
    interface Module {
        path: any;
    }
}
