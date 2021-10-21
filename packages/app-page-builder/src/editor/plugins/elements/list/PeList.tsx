import React from "react";
import { css } from "emotion";
import { usePageElements } from "@webiny/app-page-builder-elements/hooks/usePageElements";
import Text from "~/editor/components/Text";
import { getMediumEditorOptions } from "../utils/textUtils";
import { DEFAULT_EDITOR_OPTIONS } from "./List";

import { useActiveElementId } from "~/editor/hooks/useActiveElementId";

declare global {
    //eslint-disable-next-line
    namespace JSX {
        interface IntrinsicElements {
            "pb-list": any;
        }
    }
}

const defaultStyles = { display: "block" };
const listStyles = css`
    -moz-osx-font-smoothing: grayscale;
    -webkit-font-smoothing: antialiased;
    font-size: 1rem;
    line-height: 1.5rem;
    font-weight: 400;
    letter-spacing: 0.03125em;
    text-decoration: inherit;
    text-transform: inherit;

    li {
        line-height: 1.5rem;
    }

    ul,
    ol {
        margin-top: 0;
        margin-bottom: 0;
    }
`;

const PeList = props => {
    const { element, mediumEditorOptions } = props;
    const [elementId] = useActiveElementId();
    const isActive = elementId === element.id;

    const { getClassNames, getElementClassNames, combineClassNames } = usePageElements();
    const classNames = combineClassNames(
        listStyles,
        getClassNames(defaultStyles),
        getElementClassNames(element)
    );
    const tag = "div";
    return (
        <pb-list>
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
        </pb-list>
    );
};
export default React.memo(PeList);
