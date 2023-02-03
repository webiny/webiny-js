import React from "react";
import { createRenderer, useRenderer } from "@webiny/app-page-builder-elements";
import { RenderLexicalContent } from "@webiny/lexical-editor";
import { useElementVariableValue } from "@webiny/app-page-builder/editor/hooks/useElementVariableValue";

export const PeHeading = createRenderer(() => {
    const { getElement } = useRenderer();
    const element = getElement();
    const variableValue = useElementVariableValue(element);
    const __html = variableValue || element.data.text.data.text;
    return <RenderLexicalContent value={__html} />;
});
