import React from "react";
import Text from "~/editor/components/Text";
import { CoreOptions } from "medium-editor";
import { useRenderer } from "@webiny/app-page-builder-elements/hooks/useRenderer";
import { useElementVariableValue } from "~/editor/hooks/useElementVariableValue";
import { useActiveElementId } from "~/editor/hooks/useActiveElementId";
import { createRenderer } from "@webiny/app-page-builder-elements";

const mediumEditorOptions: CoreOptions = {
    toolbar: {
        buttons: ["bold", "italic", "underline", "anchor"]
    },
    anchor: {
        targetCheckbox: true,
        targetCheckboxText: "Open in a new tab"
    }
};

const PeParagraph = createRenderer(() => {
    const { getElement } = useRenderer();
    const element = getElement();
    const variableValue = useElementVariableValue(element);

    const [activeElementId] = useActiveElementId();
    const isActive = activeElementId === element.id;

    if (isActive) {
        return <Text tag={"p"} elementId={element.id} mediumEditorOptions={mediumEditorOptions} />;
    }

    const __html = variableValue || element.data.text.data.text;
    return <p dangerouslySetInnerHTML={{ __html }} />;
});

export default PeParagraph;
