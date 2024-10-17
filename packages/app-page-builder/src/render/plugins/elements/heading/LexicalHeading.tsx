import React from "react";
import {
    HeadingRenderer,
    elementInputs
} from "@webiny/app-page-builder-elements/renderers/heading";
import { usePageElements, useRenderer } from "@webiny/app-page-builder-elements";
import { assignStyles } from "@webiny/app-page-builder-elements/utils";
import { isValidLexicalData, LexicalHtmlRenderer } from "@webiny/lexical-editor";

export const LexicalHeadingRenderer = HeadingRenderer.Component.createDecorator(Original => {
    return function LexicalHeadingRenderer() {
        const { theme } = usePageElements();
        const { getInputValues } = useRenderer();
        const inputs = getInputValues<typeof elementInputs>();
        const __html = inputs.text || "";

        if (isValidLexicalData(__html)) {
            return (
                <LexicalHtmlRenderer
                    theme={theme}
                    themeStylesTransformer={styles => {
                        return assignStyles({
                            breakpoints: theme.breakpoints,
                            styles
                        });
                    }}
                    value={__html || ""}
                />
            );
        }

        return <Original />;
    };
});
