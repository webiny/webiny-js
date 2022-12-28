import React, { useMemo } from "react";
import { usePageElements } from "@webiny/app-page-builder-elements/hooks/usePageElements";
import Text from "~/editor/components/Text";
import { getMediumEditorOptions } from "../utils/textUtils";
import { CoreOptions } from "medium-editor";
import { MediumEditorOptions, PbEditorElement } from "~/types";
import { HeadingRenderer } from "@webiny/app-page-builder-elements/renderers/heading";
import { Element } from "@webiny/app-page-builder-elements/types";
import { useRenderer } from "@webiny/app-page-builder-elements";
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

interface PeHeadingProps {
    isActive?: boolean;
    element: PbEditorElement;
    mediumEditorOptions?: MediumEditorOptions;
}

const PeHeading: React.FC<PeHeadingProps> = props => {
    const { element, isActive, mediumEditorOptions } = props;
    const { renderers } = usePageElements();
    const variableValue = useElementVariableValue(element);

    const Heading = renderers.heading as HeadingRenderer;

    const EditorComponent = useMemo<React.VFC>(
        () => () => {
            const { getAttributes, getElement } = useRenderer();

            const attributes = getAttributes();
            const element = getElement();

            const tag = element.data?.text?.desktop?.tag || "h1";
            return (
                <Text
                    tag={[tag, attributes]}
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
        return <Heading element={element as Element} as={EditorComponent} value={variableValue} />;
    }

    return <Heading element={element as Element} value={variableValue} />;
};

export default PeHeading;
