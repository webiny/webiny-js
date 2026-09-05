import React from "react";
import { DocumentRenderer as BaseDocumentRenderer } from "@webiny/website-builder-react";
import { Image } from "~/editorComponents/Image.manifest.js";

export type DocumentRendererProps = React.ComponentProps<typeof BaseDocumentRenderer>;

export const DocumentRenderer = ({
    document,
    components,
    children,
    ...rest
}: DocumentRendererProps) => {
    const allComponents = [Image, ...components];
    return (
        <BaseDocumentRenderer document={document} components={allComponents} {...rest}>
            {children}
        </BaseDocumentRenderer>
    );
};
