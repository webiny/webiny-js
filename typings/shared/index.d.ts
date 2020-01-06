declare module "*.md" {
    const content: string;
    export default content;
}

declare module "*.png" {
    const content: string;
    export default content;
}


declare module "*.svg" {
    import * as React from "react";

    export const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement> & {
        alt?: string;
    }>;

    const src: string;
    export default src;
}
