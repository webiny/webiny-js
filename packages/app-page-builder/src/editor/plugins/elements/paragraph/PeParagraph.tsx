import React from "react";
import Text from "~/editor/components/Text";
import { CoreOptions } from "medium-editor";
import { MediumEditorOptions, PbEditorElement } from "~/types";
import { getMediumEditorOptions } from "../utils/textUtils";
import { usePageElements } from "@webiny/app-page-builder-elements/hooks/usePageElements";

const DEFAULT_EDITOR_OPTIONS: CoreOptions = {
    toolbar: {
        buttons: ["bold", "italic", "underline", "anchor"]
    },
    anchor: {
        targetCheckbox: true,
        targetCheckboxText: "Open in a new tab"
    }
};

const defaultStyles = { display: "block" };

interface PeParagraphProps {
    isActive?: boolean;
    element: PbEditorElement;
    mediumEditorOptions?: MediumEditorOptions;
}

declare global {
    //eslint-disable-next-line
    namespace JSX {
        interface IntrinsicElements {
            "pb-paragraph": any;
        }
    }
}

const PeParagraph: React.FC<PeParagraphProps> = props => {
    const { element, isActive, mediumEditorOptions } = props;
    const { getClassNames, getElementClassNames, combineClassNames } = usePageElements();
    const classNames = combineClassNames(
        getClassNames(defaultStyles),
        getElementClassNames(element as any)
    );

    if (isActive) {
        return (
            <Text
                tag={["pb-paragraph", { class: classNames }]}
                elementId={element.id}
                mediumEditorOptions={getMediumEditorOptions(
                    DEFAULT_EDITOR_OPTIONS,
                    mediumEditorOptions
                )}
            />
        );
    }

    const elementDataText = element.data.text || {};

    return (
        <pb-paragraph
            class={classNames}
            dangerouslySetInnerHTML={{ __html: elementDataText.data?.text }}
        />
    );
};

export default React.memo(PeParagraph);
