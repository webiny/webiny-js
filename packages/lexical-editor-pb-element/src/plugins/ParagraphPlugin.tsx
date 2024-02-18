import React from "react";
import { createDecorator } from "@webiny/react-composition";
import { useActiveElementId } from "@webiny/app-page-builder/editor/hooks/useActiveElementId";
import { Element } from "@webiny/app-page-builder-elements/types";
import Paragraph from "@webiny/app-page-builder/editor/plugins/elements/paragraph/Paragraph";
import { PeTextRenderer } from "~/components/PeTextRenderer";
import { isValidLexicalData } from "@webiny/lexical-editor";
import { useElementVariableValue } from "@webiny/app-page-builder/editor/hooks/useElementVariableValue";

export const ParagraphPlugin = createDecorator(Paragraph, Original => {
    return function ParagraphPlugin({ element, ...rest }): JSX.Element {
        const [activeElementId] = useActiveElementId();
        const variableValue = useElementVariableValue(element);
        const isActive = activeElementId === element.id;
        const content = variableValue || element?.data?.text?.data?.text;
        if (isActive || !isValidLexicalData(content)) {
            return <Original element={element} {...rest} />;
        }
        return <PeTextRenderer element={element as Element} {...rest} />;
    };
});
