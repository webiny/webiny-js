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
    return createElementRenderer("pb-paragraph", ({ element }) => {
        return <p dangerouslySetInnerHTML={{ __html: element.data.text.data.text }} />;
    });
};

const createElementRenderer = (tag: string, children: any) => {
    return function ElementRenderer({ element, before, after }) {
        const { getElementStyles, getElementAttributes } = usePageElements();

        const elementStyles = getElementStyles(element);
        const elementAttributes = getElementAttributes(element);

        return styled(
            ({ className }) => {
                return React.createElement(tag, {
                    // dangerouslySetInnerHTML: { __html: value },
                    ...elementAttributes,
                    className,
                    children: (
                        <>
                            {before ? before() : null}
                            {children({ element })}
                            {after ? after() : null}
                        </>
                    )
                });
            },
            [elementStyles]
        );
    };

    // return React.memo(
    //     function ElementRenderer(props) {
    //
    //         return <Component />;
    //     },
    //     (prevProps, nextProps) => {
    //         if (typeof propsAreEqual === "function") {
    //             if (propsAreEqual(prevProps, nextProps) === false) {
    //                 return false;
    //             }
    //         }
    //
    //         return elementDataPropsAreEqual(prevProps, nextProps);
    //     }
    // );
};

// {
//     propsAreEqual: (prevProps, nextProps) => prevProps.as === nextProps.as
// }
