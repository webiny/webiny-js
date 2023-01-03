import React from "react";
import Text from "~/editor/components/Text";
import { CoreOptions } from "medium-editor";
import { createRenderer, useRenderer } from "@webiny/app-page-builder-elements";
import { useElementVariableValue } from "~/editor/hooks/useElementVariableValue";
import { useActiveElementId } from "~/editor/hooks/useActiveElementId";

const mediumEditorOptions: CoreOptions = {
    toolbar: {
        buttons: ["bold", "italic", "underline", "anchor"]
    },
    anchor: {
        targetCheckbox: true,
        targetCheckboxText: "Open in a new tab"
    }
};

const PeHeading = createRenderer(() => {
    const { getElement } = useRenderer();
    const element = getElement();
    const variableValue = useElementVariableValue(element);

    const [activeElementId] = useActiveElementId();
    const isActive = activeElementId === element.id;

    const tag = element.data?.text?.desktop?.tag || "h1";

    if (isActive) {
        return <Text tag={tag} elementId={element.id} mediumEditorOptions={mediumEditorOptions} />;
    }

    const __html = variableValue || element.data.text.data.text;

    return React.createElement(tag, {
        dangerouslySetInnerHTML: { __html }
    });
});

export default PeHeading;
