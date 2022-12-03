import React from "react";
import { usePageElements } from "~/hooks/usePageElements";
import { ElementRenderer, ElementRendererProps } from "~/types";
import styled from "@emotion/styled";
import { elementDataPropsAreEqual } from "~/utils";

declare global {
    //eslint-disable-next-line
    namespace JSX {
        interface IntrinsicElements {
            "pb-image": any;
        }
    }
}

const defaultStyles = { display: "flex" };

interface PbImageProps {
    className?: string;
}

const PbImage: React.FC<PbImageProps> = ({ className, children }) => (
    <pb-image class={className}>{children}</pb-image>
);

export interface ImageComponentProps extends ElementRendererProps {
    onClick?: (e: React.MouseEvent<HTMLImageElement>) => void;
}

export type ImageComponent = ElementRenderer<ImageComponentProps>;

const Image: ImageComponent = ({ element, onClick }) => {
    const { getStyles, getElementStyles } = usePageElements();

    const { src, name } = element.data.image.file;

    const styles = [...getStyles(defaultStyles), ...getElementStyles(element)];

    // Image has its width / height set from its own settings.
    const PbImg = styled.img({
        width: element.data.image.width,
        height: element.data.image.height,
        maxWidth: "100%"
    });

    const StyledComponent = styled(PbImage)(styles);

    return (
        <StyledComponent>
            <PbImg alt={name} src={src} onClick={onClick} />
        </StyledComponent>
    );
};

export const createImage = () => React.memo(Image, elementDataPropsAreEqual);
