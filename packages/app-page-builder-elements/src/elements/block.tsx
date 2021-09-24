import React from "react";
import { Elements } from "~/components/Elements";
import { usePageElements } from "~/hooks/usePageElements";
import { ElementComponent } from "~/types";

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

const Block: ElementComponent = ({ element }) => {
    const { getStyles } = usePageElements();

    return (
        <pb-block class={getStyles({ element, styles: defaultStyles })}>
            <pb-block-inner>
                <Elements element={element} />
            </pb-block-inner>

        </pb-block>
    );
};

export const createBlock = () => Block;
