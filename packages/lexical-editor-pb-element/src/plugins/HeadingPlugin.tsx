import React from "react";
import { createDecorator } from "@webiny/react-composition";
import { useActiveElementId } from "@webiny/app-page-builder/editor/hooks/useActiveElementId";
import { Element } from "@webiny/app-page-builder-elements/types";
import Heading from "@webiny/app-page-builder/editor/plugins/elements/heading/Heading";
import { PeTextRenderer } from "~/components/PeTextRenderer";
import { useElementVariableValue } from "@webiny/app-page-builder/editor/hooks/useElementVariableValue";
import { isValidLexicalData } from "@webiny/lexical-editor";

export const HeadingPlugin = createDecorator(Heading, Original => {
    return function HeadingPlugin({ element, ...rest }): JSX.Element {
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
