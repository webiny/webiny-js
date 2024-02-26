import React from "react";
import { createDecorator } from "@webiny/react-composition";
import { useActiveElementId } from "@webiny/app-page-builder/editor/hooks/useActiveElementId";
import { Element } from "@webiny/app-page-builder-elements/types";
import Heading from "@webiny/app-page-builder/editor/plugins/elements/heading/Heading";
import { PeTextRenderer } from "~/components/PeTextRenderer";
import { useElementVariableValue } from "@webiny/app-page-builder/editor/hooks/useElementVariableValue";
import { isValidLexicalData } from "@webiny/lexical-editor";
import { useDynamicValue } from "@webiny/app-dynamic-pages/hooks/useDynamicValue";
import { useIsDynamicElement } from "@webiny/app-dynamic-pages/hooks/useIsDynamicElement";

const useDynamicHeadingValue = (content?: string, path?: string) => {
    const dynamicValue = useDynamicValue(path);

    if (!dynamicValue || !content) {
        return content;
    }

    const contentObject = JSON.parse(content);
    const firstChild = contentObject.root.children[0];
    firstChild.children = {
        detail: 0,
        format: 0,
        mode: "normal",
        style: "",
        text: dynamicValue,
        type: "text",
        version: 1
    };

    contentObject.root.children = [firstChild];

    return JSON.stringify(contentObject);
};

export const HeadingPlugin = createDecorator(Heading, Original => {
    return function HeadingPlugin({ element, ...rest }): JSX.Element {
        const elementContent = element?.data?.text?.data?.text;

        const [activeElementId] = useActiveElementId();
        const variableValue = useElementVariableValue(element);
        const dynamicValue = useDynamicHeadingValue(
            elementContent,
            element.data?.dynamicSource?.resolvedPath
        );
        const isDynamic = useIsDynamicElement(element);

        const isActive = activeElementId === element.id;
        const isEditable = isActive && !isDynamic;
        const content = dynamicValue || variableValue || elementContent;
        if (isEditable || !isValidLexicalData(content)) {
            return <Original element={element} {...rest} />;
        }
        return <PeTextRenderer element={element as Element} {...rest} />;
    };
});
