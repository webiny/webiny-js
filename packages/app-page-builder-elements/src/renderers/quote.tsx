import React from "react";
import { usePageElements } from "~/hooks/usePageElements";
import { Element, ElementRenderer, ElementRendererProps } from "~/types";
import styled from "@emotion/styled";
import { elementDataPropsAreEqual } from "~/utils";

declare global {
    //eslint-disable-next-line
    namespace JSX {
        interface IntrinsicElements {
            "pb-quote": any;
        }
    }
}

interface PbQuoteProps {
    className?: string;
    element: Element;
}

const PbQuote: React.FC<PbQuoteProps> = ({ className , element }) => (
    <pb-quote class={className} dangerouslySetInnerHTML={{ __html: element.data.text.data.text }} />
);

export interface QuoteComponentProps extends ElementRendererProps {
    as?: React.FC<PbQuoteProps>;
}

export type QuoteComponent = ElementRenderer<QuoteComponentProps>;

const Quote: QuoteComponent = ({ element, as }) => {
    const {  getElementStyles, getThemeStyles } = usePageElements();

    const styles = [
        { display: "block" },
        ...getThemeStyles(theme => theme.styles.quote),
        ...getElementStyles(element)
    ];

    const Component = as || PbQuote;
    const StyledComponent = styled(Component)(styles);

    return <StyledComponent element={element} />;
};

export const createQuote = () => {
    return React.memo(Quote, (prevProps, nextProps) => {
        if (prevProps.as !== nextProps.as) {
            return false;
        }

        return elementDataPropsAreEqual(prevProps, nextProps);
    });
};
