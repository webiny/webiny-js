declare module "*.css" {
    const content: Record<string, string>;
    export default content;
}
declare module "*.scss" {
    const content: Record<string, string>;
    export default content;
}

declare module "*.svg" {
    import { FunctionComponent, SVGProps } from "react";

    export const ReactComponent: FunctionComponent<
        SVGProps<SVGSVGElement> & {
            title?: string;
            // alt is not a valid attribute for svg elements
            alt?: string;
        }
    >;

    const content: string;
    export default content;
}
