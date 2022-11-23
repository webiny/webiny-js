import React from "react";
import { usePageElements } from "~/hooks/usePageElements";
import { ElementRenderer } from "~/types";

declare global {
    //eslint-disable-next-line
    namespace JSX {
        interface IntrinsicElements {
            "pb-paragraph": any;
        }
    }
}

const defaultStyles = { display: "block" };

const Paragraph: ElementRenderer = ({ element }) => {
    const { getClassNames, getElementClassNames, getThemeClassNames, combineClassNames } =
        usePageElements();
    const classNames = combineClassNames(
        getClassNames(defaultStyles),
        getElementClassNames(element),
        getThemeClassNames(theme => {
            const textStyles = element.data.text;
            return Object.keys(theme.breakpoints || {}).reduce((returnStyles, breakpointName) => {
                if (!textStyles[breakpointName]) {
                    return returnStyles;
                }

                const { typography } = textStyles[breakpointName];

                return theme.styles?.typography?.[typography];
            }, {});
        })
    );

    return (
        <pb-paragraph
            class={classNames}
            dangerouslySetInnerHTML={{ __html: element.data.text.data.text }}
        />
    );
};

export const createParagraph = () => Paragraph;
