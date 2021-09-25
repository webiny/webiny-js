import React from "react";
import { usePageElements } from "~/hooks/usePageElements";
import { ElementRenderer } from "~/types";

declare global {
    //eslint-disable-next-line
    namespace JSX {
        interface IntrinsicElements {
            "pb-image": any;
        }
    }
}

const defaultStyles = { display: "block" };

const Image: ElementRenderer = ({ element }) => {
    const { getCustomCss, getCss, css } = usePageElements();
    const classNames = css.cx(getCustomCss(defaultStyles), getCss(element));

    const { src, name } = element.data.image.file;

    return (
        <pb-image class={classNames}>
            <img alt={name} src={src} />
        </pb-image>
    );
};

export const createImage = () => Image;
