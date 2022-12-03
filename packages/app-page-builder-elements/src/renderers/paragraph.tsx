import React from "react";
import { usePageElements } from "~/hooks/usePageElements";
import { Element, ElementRenderer, ElementRendererProps } from "~/types";
import styled from "@emotion/styled";
import { elementDataPropsAreEqual } from "~/utils";

declare global {
    //eslint-disable-next-line
    namespace JSX {
        interface IntrinsicElements {
            "pb-paragraph": any;
        }
    }
}

interface PbParagraphProps {
    className?: string;
    element: Element;
}

const PbParagraph: React.FC<PbParagraphProps> = ({ className, element }) => (
    <pb-paragraph
        class={className}
        dangerouslySetInnerHTML={{ __html: element.data.text.data.text }}
    />
);

export interface ParagraphComponentProps extends ElementRendererProps {
    as?: React.FC<PbParagraphProps>;
}

export type ParagraphComponent = ElementRenderer<ParagraphComponentProps>;

const Paragraph: ParagraphComponent = ({ element, as }) => {
    const { getElementStyles } = usePageElements();

    const styles = [{ display: "block" }, ...getElementStyles(element)];

    const Component = as || PbParagraph;
    const StyledComponent = styled(Component)(styles);

    return <StyledComponent element={element} />;
};

export const createParagraph = () => {
    return React.memo(Paragraph, (prevProps, nextProps) => {
        if (prevProps.as !== nextProps.as) {
            return false;
        }

        return elementDataPropsAreEqual(prevProps, nextProps);
    });
};
