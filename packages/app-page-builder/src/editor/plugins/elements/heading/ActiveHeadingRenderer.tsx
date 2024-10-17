import React from "react";
import type { CoreOptions } from "medium-editor";
import { createRenderer, useRenderer } from "@webiny/app-page-builder-elements";
import { elementInputs } from "@webiny/app-page-builder-elements/renderers/heading";
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

export const ActiveHeadingRenderer = createRenderer<unknown, typeof elementInputs>(
    () => {
        const { getElement } = useRenderer();
        const element = getElement();

        const tag = element.data?.text?.desktop?.tag || "h1";

        return <Text tag={tag} elementId={element.id} mediumEditorOptions={mediumEditorOptions} />;
    },
    { inputs: elementInputs }
);

ActiveHeadingRenderer.displayName = "ActiveHeadingRenderer";
