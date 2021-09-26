import React from "react";
import { Elements } from "~/components/Elements";
import { usePageElements } from "~/hooks/usePageElements";
import { ElementRenderer } from "~/types";

declare global {
    //eslint-disable-next-line
    namespace JSX {
        interface IntrinsicElements {
            "pb-block": any;
            "pb-block-inner": any;
        }
    }
}

const defaultStyles = { display: "block" };

const Block: ElementRenderer = ({ element }) => {
    const { combineClassNames, getClassNames, getElementClassNames } = usePageElements();
    const classNames = combineClassNames(
        getClassNames(defaultStyles),
        getElementClassNames(element)
    );

    return (
        <pb-block class={classNames}>
            <pb-block-inner>
                <Elements element={element} />
            </pb-block-inner>
        </pb-block>
    );
};

export const createBlock = () => Block;
