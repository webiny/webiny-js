import React from "react";
import Text from "~/editor/components/Text";
import { MediumEditorOptions, PbEditorElement } from "~/types";
import { getMediumEditorOptions } from "../utils/textUtils";
import { usePageElements } from "@webiny/app-page-builder-elements/hooks/usePageElements";

const DEFAULT_EDITOR_OPTIONS = {
    toolbar: {
        buttons: ["bold", "italic", "underline", "anchor", "unorderedlist", "orderedlist"]
    },
    anchor: {
        targetCheckbox: true,
        targetCheckboxText: "Open in a new tab"
    }
};

interface PeListProps {
    isActive?: boolean;
    element: PbEditorElement;
    mediumEditorOptions?: MediumEditorOptions;
}

const defaultStyles = { display: "block" };

declare global {
    //eslint-disable-next-line
    namespace JSX {
        interface IntrinsicElements {
            "pb-list": any;
        }
    }
}

const PeList: React.FC<PeListProps> = props => {
    const { element, isActive, mediumEditorOptions } = props;
    const { getClassNames, getElementClassNames, combineClassNames } = usePageElements();
    const classNames = combineClassNames(
        getClassNames(defaultStyles),
        getElementClassNames(element as any)
    );

    if (isActive) {
        return (
            <Text
                tag={["pb-list", { class: classNames }]}
                elementId={element.id}
                mediumEditorOptions={getMediumEditorOptions(
                    DEFAULT_EDITOR_OPTIONS,
                    mediumEditorOptions
                )}
            />
        );
    }

    const elementDataText = element.data.text?.data?.text || {};

    return <pb-list class={classNames} dangerouslySetInnerHTML={{ __html: elementDataText }} />;
};
export default React.memo(PeList);

// <pb-heading>
//     {props.isActive ? (
//         <Text
//             tag={[tag, { className: classNames }]}
//             elementId={element.id}
//             mediumEditorOptions={getMediumEditorOptions(
//                 DEFAULT_EDITOR_OPTIONS,
//                 mediumEditorOptions
//             )}
//         />
//     ) : (
//         React.createElement(tag, {
//             dangerouslySetInnerHTML: { __html: elementDataText.data?.text },
//             className: classNames
//         })
//     )}
// </pb-heading>
