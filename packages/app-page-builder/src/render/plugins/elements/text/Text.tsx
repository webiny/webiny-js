import React from "react";
import { ElementRoot } from "@webiny/app-page-builder/render/components/ElementRoot";
import { PbElement } from "@webiny/app-page-builder/types";
import TextRenderer from "../RichTextEditorOutputRenderer";

type TextPropsType = {
    element: PbElement;
};
const Text: React.FunctionComponent<TextPropsType> = ({ element }) => {
    return (
        <ElementRoot element={element} className={className}>
            <TextRenderer data={element.data.text} />
        </ElementRoot>
    );
};

export const className = "webiny-pb-base-page-element-style webiny-pb-page-element-text";

export default Text;
