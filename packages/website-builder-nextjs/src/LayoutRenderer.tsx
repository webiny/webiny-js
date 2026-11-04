import React from "react";
import { LayoutRenderer as BaseLayoutRenderer } from "@webiny/website-builder-react";
import { Image } from "~/editorComponents/Image.manifest.js";

export type LayoutRendererProps = React.ComponentProps<typeof BaseLayoutRenderer>;

export const LayoutRenderer = ({ components, children, ...props }: LayoutRendererProps) => {
    const allComponents = [Image, ...components];
    return (
        <BaseLayoutRenderer {...props} components={allComponents}>
            {children}
        </BaseLayoutRenderer>
    );
};
