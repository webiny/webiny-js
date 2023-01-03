import React from "react";
import styled from "@emotion/styled";
import { createRenderer } from "~/createRenderer";
import { useRenderer } from "~/hooks/useRenderer";
import { LinkComponent } from "~/types";
import { DefaultLinkComponent } from "~/renderers/components";

export interface ImageElementData {
    image?: {
        title: string;
        width: string;
        height: string;
        file?: {
            src: string;
        };
    };
    link?: {
        newTab: boolean;
        href: string;
    };
}

interface Props {
    onClick?: React.MouseEventHandler<HTMLImageElement>;
    renderEmpty?: React.ReactNode;
    value?: { id: string; src: string };
    link?: { href: string; newTab?: boolean };
}

export interface CreateImageParams {
    linkComponent?: LinkComponent;
}

export type ImageRenderer = ReturnType<typeof createImage>;

export const createImage = (params: CreateImageParams = {}) => {
    const LinkComponent = params?.linkComponent || DefaultLinkComponent;

    return createRenderer<Props>(
        ({ onClick, renderEmpty, value, link }) => {
            const { getElement } = useRenderer();

            const element = getElement<ImageElementData>();

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

            const linkProps = link || element.data?.link;
            if (linkProps) {
                const { href, newTab } = linkProps;
                if (href) {
                    content = (
                        <LinkComponent href={href} target={newTab ? "_blank" : "_self"}>
                            {content}
                        </LinkComponent>
                    );
                }
            }

            return <>{content}</>;
        },
        {
            baseStyles: { width: "100%" },
            propsAreEqual: (prevProps: Props, nextProps: Props) => {
                return prevProps.value === nextProps.value;
            }
        }
    );
};
