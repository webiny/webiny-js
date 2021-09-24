import React from "react";
import { usePageElements } from "~/hooks/usePageElements";
import { ElementComponent } from "~/types";

declare global {
    //eslint-disable-next-line
    namespace JSX {
        interface IntrinsicElements {
            "pb-image": any;
        }
    }
}

const defaultStyles = { display: "block" };

const Image: ElementComponent = ({ element }) => {
    const { src, name } = element.data.image.file;
    const { getStyles } = usePageElements();

    return (
        <pb-image class={getStyles({ element, styles: defaultStyles })}>
            <img alt={name} src={src} />
        </pb-image>
    );
};

export const createImage = () => Image;
