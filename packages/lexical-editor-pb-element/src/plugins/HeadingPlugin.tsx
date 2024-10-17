import React from "react";
import {
    ActiveHeadingRenderer,
    elementInputs
} from "@webiny/app-page-builder/editor/plugins/elements/heading";
import { isValidLexicalData } from "@webiny/lexical-editor";
import { useRenderer } from "@webiny/app-page-builder-elements";
import { LexicalTextEditor } from "~/components/LexicalTextEditor";

export const LexicalActiveHeadingRenderer = ActiveHeadingRenderer.Component.createDecorator(
    Original => {
        return function LexicalActiveParagraphRenderer() {
            const { getInputValues } = useRenderer();
            const inputs = getInputValues<typeof elementInputs>();
            const __html = inputs.text || "";

            if (!isValidLexicalData(__html)) {
                return <Original />;
            }

            return <LexicalTextEditor type={"heading"} text={__html} />;
        };
    }
);
