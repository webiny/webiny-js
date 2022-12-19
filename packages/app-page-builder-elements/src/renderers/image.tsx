import React from "react";
import styled from "@emotion/styled";
import { createRenderer } from "~/createRenderer";
import { useRenderer } from "~/hooks/useRenderer";

export type ImageRenderer = ReturnType<typeof createImage>;

interface Props {
    onClick?: React.MouseEventHandler<HTMLImageElement>;
    renderEmpty?: React.ReactNode;
}

export const createImage = () => {
    return createRenderer<Props>(({ onClick, renderEmpty }) => {
        const { getElement, getAttributes } = useRenderer();

        const element = getElement();

        let content;
        if (element.data?.image?.file?.src) {
            // Image has its width / height set from its own settings.
            const PbImg = styled.img({
                width: element.data.image.width,
                height: element.data.image.height,
                maxWidth: "100%"
            });

            const { title } = element.data.image;
            const { src } = element.data.image.file;
            content = <PbImg alt={title} title={title} src={src} onClick={onClick} />;
        } else {
            content = renderEmpty || null;
        }

        return <div {...getAttributes()}>{content}</div>;
    });
};
