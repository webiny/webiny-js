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

const defaultStyles = { display: "block", boxSizing: "border-box" };

const Block: ElementRenderer = ({ element }) => {
    const { getClassNames, getElementClassNames } = usePageElements();
    const classNames = getClassNames(defaultStyles);

    return (
        <pb-block class={classNames}>
            <pb-block-inner class={getElementClassNames(element)}>
                <Elements element={element} />
            </pb-block-inner>
        </pb-block>
    );
};

export const createBlock = (props) => {
    if (props.x) {
        return null;
    }

    // vracamo element
    return <Block {...props}/>
};
