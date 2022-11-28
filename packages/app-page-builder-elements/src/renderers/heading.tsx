import React from "react";
import { usePageElements } from "~/hooks/usePageElements";
import { ElementRenderer } from "~/types";
import styled from "@emotion/styled";

declare global {
    //eslint-disable-next-line
    namespace JSX {
        interface IntrinsicElements {
            "pb-heading": any;
        }
    }
}

const defaultStyles = {
    display: "block"
};

const Heading: ElementRenderer = ({ element }) => {
    const { getStyles, getElementStyles } = usePageElements();
    const tag = element.data.text.desktop.tag || "h1";

    const styles = [...getStyles(defaultStyles), ...getElementStyles(element)];
    const Content = styled(({ className }) =>
        React.createElement(tag, {
            dangerouslySetInnerHTML: {
                __html: element.data.text.data.text
            },
            className
        })
    )(styles);

    return (
        <pb-heading data-pe-id={element.id}>
            <Content />
        </pb-heading>
    );
};

export const createHeading = () => Heading;
