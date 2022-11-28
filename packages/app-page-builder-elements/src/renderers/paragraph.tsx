import React from "react";
import { usePageElements } from "~/hooks/usePageElements";
import { ElementRenderer } from "~/types";
import styled from "@emotion/styled";

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
    const { getStyles, getElementStyles } = usePageElements();

    const styles = [...getStyles(defaultStyles), ...getElementStyles(element)];
    const PbParagraph = styled(({ className }) => (
        <pb-paragraph
            class={className}
            dangerouslySetInnerHTML={{ __html: element.data.text.data.text }}
        />
    ))(styles);

    return <PbParagraph />;
};

export const createParagraph = () => Paragraph;
