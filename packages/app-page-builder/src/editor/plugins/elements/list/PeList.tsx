import React from "react";
import Text from "~/editor/components/Text";
import { createRenderer, useRenderer } from "@webiny/app-page-builder-elements";
import { useElementVariableValue } from "~/editor/hooks/useElementVariableValue";
import { useActiveElementId } from "~/editor/hooks/useActiveElementId";
import { CoreOptions } from "medium-editor";

const mediumEditorOptions: CoreOptions = {
    toolbar: {
        buttons: ["bold", "italic", "underline", "anchor", "unorderedlist", "orderedlist"]
    },
    anchor: {
        targetCheckbox: true,
        targetCheckboxText: "Open in a new tab"
    }
};

const PeList = createRenderer(
    () => {
        const { getElement } = useRenderer();
        const element = getElement();
        const variableValue = useElementVariableValue(element);

        const [activeElementId] = useActiveElementId();
        const isActive = activeElementId === element.id;

        if (isActive) {
            return (
                <Text
                    tag={"div"}
                    elementId={element.id}
                    mediumEditorOptions={mediumEditorOptions}
                />
            );
        }

        const __html = variableValue || element.data.text.data.text;
        return <div style={{ width: "100%" }} dangerouslySetInnerHTML={{ __html }} />;
    },
    {
        baseStyles: { width: "100%" }
    }
);

export default PeList;
