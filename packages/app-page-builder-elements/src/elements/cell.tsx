import React from "react";
import { Elements } from "~/components/Elements";
import { usePageElements } from "~/hooks/usePageElements";
import { ElementComponent } from "~/types";

declare global {
    //eslint-disable-next-line
    namespace JSX {
        interface IntrinsicElements {
            "pb-cell": any;
        }
    }
}

const defaultStyles = { display: "block" };

const Cell: ElementComponent = ({ element }) => {
    const { getStyles } = usePageElements();

    return (
        <pb-cell class={getStyles({ element, styles: defaultStyles })}>
            <Elements element={element} />
        </pb-cell>
    );
};

export const createCell = () => Cell;
