import React from "react";
import styled from "@emotion/styled";
import { createRenderer } from "~/createRenderer";
import { useRenderer } from "~/hooks/useRenderer";
import { LinkComponent } from "~/types";
import { ButtonClickHandler } from "~/renderers/button";
import { DefaultLinkComponent } from "~/renderers/components";

export type ImageRenderer = ReturnType<typeof createImage>;

interface Props {
    onClick?: React.MouseEventHandler<HTMLImageElement>;
    renderEmpty?: React.ReactNode;
    value?: { id: string; src: string };
}

export interface CreateImageParams {
    linkComponent?: LinkComponent;
}

export const createImage = (params: CreateImageParams) => {
    const LinkComponent = params?.linkComponent || DefaultLinkComponent;

    return createRenderer<Props>(
        ({ onClick, renderEmpty, value }) => {
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
                const { src } = value || element.data?.image?.file;
                content = <PbImg alt={title} title={title} src={src} onClick={onClick} />;
            } else {
                content = renderEmpty || null;
            }

            if (element.data?.link) {
                const { href, newTab } = element.data.link;
                content = (
                    <LinkComponent href={href} target={newTab ? "_blank" : "_self"}>
                        {content}
                    </LinkComponent>
                );
            }

            return <div {...getAttributes()}>{content}</div>;
        },
        {
            baseStyles: { width: "100%" },
            propsAreEqual: (prevProps: Props, nextProps: Props) => {
                return prevProps.value === nextProps.value;
            }
        }
    );
};
