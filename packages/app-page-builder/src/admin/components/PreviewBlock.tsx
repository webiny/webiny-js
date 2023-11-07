import React from "react";
import { Content as ContentType } from "@webiny/app-page-builder-elements/types";
import { Content } from "@webiny/app-page-builder-elements/components/Content";
import { PbPageBlock, PbEditorElement } from "~/types";
import { addElementId } from "~/editor/helpers";

export const PreviewBlock = ({ element }: { element: PbPageBlock | PbEditorElement }) => {
    const elementsWithIds = addElementId(element.content);

    return <Content content={elementsWithIds as ContentType} />;
};
