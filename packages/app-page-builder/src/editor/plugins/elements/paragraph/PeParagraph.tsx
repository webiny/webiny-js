import React from "react";
import { usePageElements } from "@webiny/app-page-builder-elements/hooks/usePageElements";
import Text from "~/editor/components/Text";
import { getMediumEditorOptions } from "../utils/textUtils";
import { DEFAULT_EDITOR_OPTIONS } from "./Paragraph";

declare global {
    //eslint-disable-next-line
    namespace JSX {
        interface IntrinsicElements {
            "pb-paragraph": any;
        }
    }
}

const defaultStyles = { display: "block" };

const PeParagraph = props => {
    const { element, mediumEditorOptions } = props;

    const { getClassNames, getElementClassNames, combineClassNames } = usePageElements();
    const classNames = combineClassNames(
        getClassNames(defaultStyles),
        getElementClassNames(element)
    );
    const tag = "p";
    return (
        <pb-paragraph>
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
                    dangerouslySetInnerHTML: { __html: element.data.text.data.text },
                    className: classNames
                })
            )}
        </pb-paragraph>
    );
};
export default React.memo(PeParagraph);
