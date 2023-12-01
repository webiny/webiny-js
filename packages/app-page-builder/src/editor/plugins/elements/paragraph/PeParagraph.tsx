import React from "react";
import Text from "~/editor/components/Text";
import { CoreOptions } from "medium-editor";
import { useRenderer } from "@webiny/app-page-builder-elements/hooks/useRenderer";
import { useElementVariableValue } from "~/editor/hooks/useElementVariableValue";
import { useActiveElementId } from "~/editor/hooks/useActiveElementId";
import { createRenderer } from "@webiny/app-page-builder-elements";
import { CompositionScope } from "@webiny/app-admin";

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
        return (
            <CompositionScope name={"pb.paragraph"}>
                <Text tag={"p"} elementId={element.id} mediumEditorOptions={mediumEditorOptions} />
            </CompositionScope>
        );
    }

    const __html = variableValue || element.data.text.data.text;

    // If the text already contains `p` tags (happens when c/p-ing text into the editor),
    // we don't want to wrap it with another pair of `p` tag.
    if (__html.startsWith("<p")) {
        // @ts-expect-error We don't need type-checking here.
        return <p-wrap dangerouslySetInnerHTML={{ __html }} />;
    }

    return <p dangerouslySetInnerHTML={{ __html }} />;
});

export default PeParagraph;
