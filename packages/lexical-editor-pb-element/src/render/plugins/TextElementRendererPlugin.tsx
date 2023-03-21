import React from "react";
import get from "lodash/get";
import { createComponentPlugin } from "@webiny/react-composition";
import TextElement from "@webiny/app-page-builder/render/components/Text";
import { isValidLexicalData, LexicalHtmlRenderer } from "@webiny/lexical-editor";
import { LexicalValue } from "@webiny/lexical-editor/types";
import { usePageElements } from "@webiny/app-page-builder-elements";

const DATA_NAMESPACE = "data.text";

/**
 * @description This plugin compose the Legacy TextElement component to support new lexical content
 * Note: This component is deprecated and will be completely removed in next version when
 * Lexical editor will be fully implemented in Webiny.
 */
export const TextElementRendererPlugin = createComponentPlugin(TextElement, Original => {
    return function TextElementRendererPlugin({ element, rootClassName }): JSX.Element {
        const textContent = get(element, `${DATA_NAMESPACE}.data.text`) as LexicalValue;
        const { theme } = usePageElements();
        return isValidLexicalData(textContent) ? (
            <LexicalHtmlRenderer theme={theme} value={textContent} />
        ) : (
            <Original element={element} rootClassName={rootClassName} />
        );
    };
});
