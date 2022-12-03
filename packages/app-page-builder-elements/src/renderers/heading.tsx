import React from "react";
import { usePageElements } from "~/hooks/usePageElements";
import { Element, ElementRenderer, ElementRendererProps } from "~/types";
import styled from "@emotion/styled";
import { elementDataPropsAreEqual } from "~/utils";

declare global {
    //eslint-disable-next-line
    namespace JSX {
        interface IntrinsicElements {
            "pb-heading": any;
        }
    }
}

interface ContentProps {
    className?: string;
    tag: string;
    element: Element;
}

const Content: React.FC<ContentProps> = ({ tag, className, element }) =>
    React.createElement(tag, {
        dangerouslySetInnerHTML: {
            __html: element.data.text.data.text
        },
        className
    });

export interface HeadingComponentProps extends ElementRendererProps {
    as?: React.FC<ContentProps>;
}

export type HeadingComponent = ElementRenderer<HeadingComponentProps>;

const Heading: HeadingComponent = ({ element, as }) => {
    const { getElementStyles } = usePageElements();
    const tag = element.data.text.desktop.tag || "h1";

    const styles = [{ display: "block" }, ...getElementStyles(element)];

    const Component = as || Content;
    const StyledComponent = styled(Component)(styles);

    return (
        <pb-heading data-pe-id={element.id}>
            <StyledComponent tag={tag} element={element} />
        </pb-heading>
    );
};

export const createHeading = () => {
    return React.memo(Heading, (prevProps, nextProps) => {
        if (prevProps.as !== nextProps.as) {
            return false;
        }

        return elementDataPropsAreEqual(prevProps, nextProps);
    });
};
