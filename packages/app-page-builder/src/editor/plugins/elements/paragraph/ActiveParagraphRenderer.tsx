import React from "react";
import type { CoreOptions } from "medium-editor";
import { createRenderer, useRenderer } from "@webiny/app-page-builder-elements";
import { elementInputs } from "@webiny/app-page-builder-elements/renderers/paragraph";
import Text from "~/editor/components/Text";

const mediumEditorOptions: CoreOptions = {
    toolbar: {
        buttons: ["bold", "italic", "underline", "anchor"]
    },
    anchor: {
        targetCheckbox: true,
        targetCheckboxText: "Open in a new tab"
    }
};

export { elementInputs };

export const ActiveParagraphRenderer = createRenderer<unknown, typeof elementInputs>(
    () => {
        const { getElement } = useRenderer();
        const element = getElement();

        return <Text tag={"p"} elementId={element.id} mediumEditorOptions={mediumEditorOptions} />;
    },
    { inputs: elementInputs }
);

ActiveParagraphRenderer.displayName = "ActiveParagraphRenderer";
