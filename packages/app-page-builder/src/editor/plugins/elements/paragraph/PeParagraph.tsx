import React, { useMemo } from "react";
import Text from "~/editor/components/Text";
import { CoreOptions } from "medium-editor";
import { MediumEditorOptions, PbEditorElement } from "~/types";
import { getMediumEditorOptions } from "../utils/textUtils";
import { usePageElements } from "@webiny/app-page-builder-elements/hooks/usePageElements";
import {
    ParagraphComponent,
    ParagraphComponentProps
} from "@webiny/app-page-builder-elements/renderers/paragraph";
import { Element } from "@webiny/app-page-builder-elements/types";

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

    const Paragraph = renderers.paragraph as ParagraphComponent;

    const EditorComponent = useMemo<ParagraphComponentProps["as"]>(() => {
        return function EditorComponent({ className }) {
            return (
                <Text
                    tag={["pb-paragraph", { class: className }]}
                    elementId={element.id}
                    mediumEditorOptions={getMediumEditorOptions(
                        DEFAULT_EDITOR_OPTIONS,
                        mediumEditorOptions
                    )}
                />
            );
        };
    }, []);

    if (isActive) {
        return <Paragraph element={element as Element} as={EditorComponent} />;
    }

    return <Paragraph element={element as Element} />;
};
export default PeParagraph;
