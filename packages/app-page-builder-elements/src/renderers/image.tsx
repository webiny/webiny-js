import React from "react";
import { usePageElements } from "~/hooks/usePageElements";
import { ElementRenderer } from "~/types";
import styled from "@emotion/styled";

declare global {
    //eslint-disable-next-line
    namespace JSX {
        interface IntrinsicElements {
            "pb-image": any;
        }
    }
}

const defaultStyles = { display: "flex" };

const Image: ElementRenderer = ({ element }) => {
    const { getStyles, getElementStyles } = usePageElements();

    const { src, name } = element.data.image.file;

    const styles = [...getStyles(defaultStyles), ...getElementStyles(element)];
    const PbImage = styled(({ className, children }) => (
        <pb-image class={className}>{children}</pb-image>
    ))(styles);

    // Image has its width / height set from its own settings.
    const PbImg = styled.img({
        width: element.data.image.width,
        height: element.data.image.height,
    })

    return (
        <PbImage>
            <PbImg alt={name} src={src} />
        </PbImage>
    );
};

export const createImage = () => Image;
