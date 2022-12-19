import React from "react";
import { createRenderer } from "~/createRenderer";
import { useRenderer } from "~/hooks/useRenderer";
import { createParagraph } from "~/renderers/paragraph";

interface Props {
    as?: React.ComponentType;
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
            return React.createElement(tag, {
                ...getAttributes(),
                dangerouslySetInnerHTML: {
                    __html: element.data.text.data.text
                }
            });
        },
        {
            propsAreEqual: (prevProps: Props, nextProps: Props) => {
                return prevProps.as === nextProps.as;
            }
        }
    );
};
