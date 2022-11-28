import React from "react";
import { usePageElements } from "~/hooks/usePageElements";
import { ElementRenderer } from "~/types";
import styled from "@emotion/styled";

declare global {
    //eslint-disable-next-line
    namespace JSX {
        interface IntrinsicElements {
            "pb-quote": any;
        }
    }
}

const defaultStyles = { display: "block" };

const Quote: ElementRenderer = ({ element }) => {
    const { getStyles, getElementStyles } = usePageElements();

    const styles = [...getStyles(defaultStyles), ...getElementStyles(element)];
    const PbQuote = styled(({ className }) => (
        <pb-quote
            class={className}
            dangerouslySetInnerHTML={{ __html: element.data.text.data.text }}
        />
    ))(styles);

    // It's how editor works, inserts blockquote / q tags.
    return <PbQuote />;
};

export const createQuote = () => Quote;
