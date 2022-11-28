import React from "react";
import Text from "~/editor/components/Text";
import { MediumEditorOptions, PbEditorElement } from "~/types";
import { getMediumEditorOptions } from "../utils/textUtils";
import { usePageElements } from "@webiny/app-page-builder-elements/hooks/usePageElements";
import styled from "@emotion/styled";

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
    const { getStyles, getElementStyles, getThemeStyles } = usePageElements();

    if (isActive) {
        return (
            <Text
                tag={["pb-list", { class: 'classNames' }]}
                elementId={element.id}
                mediumEditorOptions={getMediumEditorOptions(
                    DEFAULT_EDITOR_OPTIONS,
                    mediumEditorOptions
                )}
            />
        );
    }

    const styles = [
        ...getStyles(defaultStyles),
        ...getElementStyles(element),
        ...getThemeStyles(theme => theme?.styles?.list)
    ];

    const PbList = styled(({ className }) => (
        <pb-list
            class={className}
            dangerouslySetInnerHTML={{ __html: element.data.text.data.text }}
        />
    ))(styles);

    return <PbList />;

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
