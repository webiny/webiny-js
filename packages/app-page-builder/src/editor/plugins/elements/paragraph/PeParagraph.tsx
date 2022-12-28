import React, { useMemo } from "react";
import Text from "~/editor/components/Text";
import { CoreOptions } from "medium-editor";
import { MediumEditorOptions, PbEditorElement } from "~/types";
import { getMediumEditorOptions } from "../utils/textUtils";
import { usePageElements } from "@webiny/app-page-builder-elements/hooks/usePageElements";
import { ParagraphRenderer } from "@webiny/app-page-builder-elements/renderers/paragraph";
import { Element } from "@webiny/app-page-builder-elements/types";
import { useRenderer } from "@webiny/app-page-builder-elements/hooks/useRenderer";
import { useElementVariableValue } from "~/editor/hooks/useElementVariableValue";

const DEFAULT_EDITOR_OPTIONS: CoreOptions = {
    toolbar: {
        buttons: ["bold", "italic", "underline", "anchor"]
    },
    anchor: {
        targetCheckbox: true,
        targetCheckboxText: "Open in a new tab"
    }
};

interface PeParagraphProps {
    isActive?: boolean;
    element: PbEditorElement;
    mediumEditorOptions?: MediumEditorOptions;
}

const PeParagraph: React.FC<PeParagraphProps> = props => {
    const { element, isActive, mediumEditorOptions } = props;
    const { renderers } = usePageElements();
    const variableValue = useElementVariableValue(element);

    const Paragraph = renderers.paragraph as ParagraphRenderer;

    const EditorComponent = useMemo<React.ComponentType>(
        () => () => {
            const { getAttributes, getElement } = useRenderer();

            const attributes = getAttributes();
            const element = getElement();

            return (
                <Text
                    tag={["p", attributes]}
                    elementId={element.id}
                    mediumEditorOptions={getMediumEditorOptions(
                        DEFAULT_EDITOR_OPTIONS,
                        mediumEditorOptions
                    )}
                />
            );
        },
        []
    );

    if (isActive) {
        return (
            <Paragraph element={element as Element} as={EditorComponent} value={variableValue} />
        );
    }

    return <Paragraph element={element as Element} value={variableValue} />;
};
export default PeParagraph;
