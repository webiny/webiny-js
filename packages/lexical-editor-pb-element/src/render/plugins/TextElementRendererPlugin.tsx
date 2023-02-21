import React from "react";
import get from "lodash/get";
import { createComponentPlugin } from "@webiny/react-composition";
import TextElement from "@webiny/app-page-builder/render/components/Text";
import { isValidLexicalData, LexicalHtmlRenderer } from "@webiny/lexical-editor";
import { EditorStateJSONString } from "@webiny/lexical-editor/types";

const DATA_NAMESPACE = "data.text";

// TODO: leave comment here why this plugin even exists
export const TextElementRendererPlugin = createComponentPlugin(TextElement, Original => {
    return function TextElementRendererPlugin({ element, rootClassName }): JSX.Element {
        const textContent = get(element, `${DATA_NAMESPACE}.data.text`);
        return isValidLexicalData(textContent) ? (
            <LexicalHtmlRenderer value={textContent as EditorStateJSONString} />
        ) : (
            <Original element={element} rootClassName={rootClassName} />
        );
    };
});
