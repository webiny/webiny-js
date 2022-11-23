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
    const { getClassNames, getElementClassNames, combineClassNames } = usePageElements();
    const classNames = combineClassNames(
        getClassNames(defaultStyles),
        getElementClassNames(element)
    );

    const { src, name } = element.data.image.file;

    // Image has its width / height set from its own settings.
    const [imgClassNames] = getClassNames({
        width: element.data.image.width,
        height: element.data.image.height,
    })

    return (
        <pb-image class={classNames}>
            <img alt={name} src={src} className={imgClassNames} />
        </pb-image>
    );
};

export const createImage = () => Image;
