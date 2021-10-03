import React from "react";
import { usePageElements } from "~/hooks/usePageElements";
import { ElementRenderer } from "~/types";

declare global {
    //eslint-disable-next-line
    namespace JSX {
        interface IntrinsicElements {
            "pb-heading": any;
        }
    }
}

const defaultStyles = { display: "block" };

const Heading: ElementRenderer = ({ element }) => {
    const { getClassNames, getElementClassNames, getThemeClassNames, combineClassNames } =
        usePageElements();
    const tag = element.data.text.desktop.tag || "h1";

    const classNames = combineClassNames(
        getClassNames(defaultStyles),
        getElementClassNames(element),
        getThemeClassNames(theme => theme.styles.typography.h),
        getThemeClassNames(theme => theme.styles.typography[tag])
    );

    return (
        <pb-heading class={classNames}>
            {React.createElement(tag, {
                dangerouslySetInnerHTML: { __html: element.data.text.data.text }
            })}
        </pb-heading>
    );
};

export const createHeading = () => Heading;
