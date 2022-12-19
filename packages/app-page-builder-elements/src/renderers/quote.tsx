import React from "react";
import { createRenderer } from "~/createRenderer";
import { useRenderer } from "~/hooks/useRenderer";

interface Props {
    as?: React.ComponentType;
}

export type QuoteRenderer = ReturnType<typeof createQuote>;

export const createQuote = () => {
    return createRenderer<Props>(
        props => {
            const { getElement, getAttributes } = useRenderer();

            if (props.as) {
                const As = props.as;
                return <As />;
            }

            const __html = getElement().data.text.data.text;
            return <div {...getAttributes()} dangerouslySetInnerHTML={{ __html }} />;
        },
        {
            propsAreEqual: (prevProps: Props, nextProps: Props) => {
                return prevProps.as === nextProps.as;
            }
        }
    );
};
