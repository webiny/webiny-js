import React from "react";
import { createRenderer } from "~/createRenderer";
import { useRenderer } from "~/hooks/useRenderer";
import { createParagraph } from "~/renderers/paragraph";

interface Props {
    as?: React.ComponentType;
    value?: string;
}

export type HeadingRenderer = ReturnType<typeof createParagraph>;

export const createHeading = () => {
    return createRenderer<Props>(
        props => {
            const { getElement, getAttributes } = useRenderer();
            const element = getElement();

            if (props.as) {
                const As = props.as;
                return <As />;
            }

            const tag = element.data.text.desktop.tag || "h1";

            const __html = props.value || element.data.text.data.text;

            return React.createElement(tag, {
                ...getAttributes(),
                dangerouslySetInnerHTML: { __html }
            });
        },
        {
            propsAreEqual: (prevProps: Props, nextProps: Props) => {
                return prevProps.as === nextProps.as && prevProps.value === nextProps.value;
            },
            baseStyles: { width: "100%" }
        }
    );
};
