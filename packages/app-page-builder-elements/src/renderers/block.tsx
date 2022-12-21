import React from "react";
import { Elements } from "~/components/Elements";
import { Element, Renderer } from "~/types";
import { createRenderer } from "~/createRenderer";
import { useRenderer } from "~/hooks/useRenderer";

export interface BlockComponentProps {
    element: Element;
    elements?: Array<Element>;
    className?: string;
}

export type BlockComponent = Renderer<BlockComponentProps>;

interface Props {
    elements?: Element[];
}

export const createBlock = () => {
    return createRenderer(
        (props: Props) => {
            const { getElement, getAttributes } = useRenderer();

            const element = getElement();
            return (
                <div {...getAttributes()}>
                    <Elements element={element} elements={props.elements} />
                </div>
            );
        },
        {
            baseStyles: {
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-start",
                alignItems: "flex-start",
                boxSizing: "border-box"
            }
        }
    );
};
