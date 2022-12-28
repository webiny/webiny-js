import React from "react";
import { createRenderer } from "~/createRenderer";
import { useRenderer } from "~/hooks/useRenderer";

interface Props {
    as?: React.ComponentType;
    value?: string
}

export type ListRenderer = ReturnType<typeof createList>;

export const createList = () => {
    return createRenderer<Props>(
        props => {
            const { getElement, getAttributes } = useRenderer();

            if (props.as) {
                const As = props.as;
                return <As />;
            }

            const __html = props.value || getElement().data.text.data.text;

            return (
                <div
                    {...getAttributes()}
                    style={{ display: "block", width: "100%" }}
                    dangerouslySetInnerHTML={{ __html }}
                />
            );
        },
        {
            propsAreEqual: (prevProps: Props, nextProps: Props) => {
                return prevProps.as === nextProps.as && prevProps.value === nextProps.value;
            }
        }
    );
};
