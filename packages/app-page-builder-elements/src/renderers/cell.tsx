import React from "react";
import { Elements } from "~/components/Elements";
import { usePageElements } from "~/hooks/usePageElements";
import { ElementRenderer } from "~/types";

declare global {
    //eslint-disable-next-line
    namespace JSX {
        interface IntrinsicElements {
            "pb-cell": any;
        }
    }
}

const defaultStyles = { display: "block" };

const Cell: ElementRenderer = ({ element }) => {
    const { getCustomCss, getCss, css } = usePageElements();
    const classNames = css.cx(getCustomCss(defaultStyles), getCss(element));

    return (
        <pb-cell class={classNames}>
            <Elements element={element} />
        </pb-cell>
    );
};

export const createCell = () => Cell;
