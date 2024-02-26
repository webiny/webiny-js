import React from "react";
import { Content } from "@webiny/app-page-builder-elements/components/Content";
import { PbPageBlock, PbEditorElement } from "~/types";

interface PreviewBlockProps {
    element: PbPageBlock | PbEditorElement;
}

export const PreviewBlock = React.memo(({ element }: PreviewBlockProps) => {
    return <Content content={element.content} />;
});

PreviewBlock.displayName = "PreviewBlock";
