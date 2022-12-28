// @ts-nocheck TODO: WILL BE HANDLED IN A UPCOMING PR.
import React from "react";
import { usePageElements } from "@webiny/app-page-builder-elements/hooks/usePageElements";
import Text from "~/editor/components/Text";
import { getMediumEditorOptions } from "../utils/textUtils";
import { CoreOptions } from "medium-editor";
import { MediumEditorOptions, PbEditorElement } from "~/types";

declare global {
    //eslint-disable-next-line
    namespace JSX {
        interface IntrinsicElements {
            "pb-heading": any;
        }
    }
}

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

interface PeHeadingProps {
    isActive?: boolean;
    element: PbEditorElement;
    mediumEditorOptions?: MediumEditorOptions;
}
const PeHeading: React.FC<PeHeadingProps> = props => {
    const { element, mediumEditorOptions } = props;
    const elementDataText = element.data.text || {};
    const tag = elementDataText.desktop?.tag || "h1";

    const { getClassNames, getElementClassNames, combineClassNames } = usePageElements();
    const classNames = combineClassNames(
        getClassNames(defaultStyles),
        // TODO @ts-refactor figure out correct type
        getElementClassNames(element as any)
    );

    return (
        <pb-heading>
            {props.isActive ? (
                <Text
                    tag={[tag, { className: classNames }]}
                    elementId={element.id}
                    mediumEditorOptions={getMediumEditorOptions(
                        DEFAULT_EDITOR_OPTIONS,
                        mediumEditorOptions
                    )}
                />
            ) : (
                React.createElement(tag, {
                    dangerouslySetInnerHTML: { __html: elementDataText.data?.text },
                    className: classNames
                })
            )}
        </pb-heading>
    );
};

export default PeHeading;
