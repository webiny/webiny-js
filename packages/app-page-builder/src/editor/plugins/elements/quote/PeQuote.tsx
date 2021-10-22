import React from "react";
import Text from "~/editor/components/Text";
import { usePageElements } from "@webiny/app-page-builder-elements/hooks/usePageElements";
import { Element } from "@webiny/app-page-builder-elements/types";
import { PeEditorTextElementProps } from "~/types";
import { getMediumEditorOptions } from "../utils/textUtils";
import { DEFAULT_EDITOR_OPTIONS } from "./Quote";

declare global {
    //eslint-disable-next-line
    namespace JSX {
        interface IntrinsicElements {
            "pb-quote": any;
        }
    }
}

const defaultStyles = { display: "block" };

const PeQuote: React.FC<PeEditorTextElementProps> = ({
    element,
    mediumEditorOptions,
    isActive
}) => {
    const { getClassNames, getElementClassNames, combineClassNames } = usePageElements();
    const classNames = combineClassNames(
        getClassNames(defaultStyles),
        getElementClassNames(element as Element)
    );
    const tag = "div";

    return (
        <pb-quote>
            {isActive ? (
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
        </pb-quote>
    );
};
export default React.memo(PeQuote);
