import React from "react";
import { createRenderer } from "~/createRenderer";
import { useRenderer } from "~/hooks/useRenderer";

interface Props {
    as?: React.ComponentType;
    value?: string
}

export type ParagraphRenderer = ReturnType<typeof createParagraph>;

export const createParagraph = () => {
    return createRenderer<Props>(
        props => {
            const { getElement, getAttributes } = useRenderer();

            if (props.as) {
                const As = props.as;
                return <As />;
            }

            const __html = props.value || getElement().data.text.data.text;
            return <p {...getAttributes()} dangerouslySetInnerHTML={{ __html }} />;
        },
        {
            propsAreEqual: (prevProps: Props, nextProps: Props) => {
                return prevProps.as === nextProps.as && prevProps.value === nextProps.value;
            }
        }
    );
};
