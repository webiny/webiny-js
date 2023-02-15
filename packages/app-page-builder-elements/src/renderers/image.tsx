import React from "react";
import styled from "@emotion/styled";
import { createRenderer, CreateRendererOptions } from "~/createRenderer";
import { useRenderer } from "~/hooks/useRenderer";
import { LinkComponent as LinkComponentType } from "~/types";
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

export interface ImageRendererComponentProps extends Props, CreateImageParams {}

const SUPPORTED_IMAGE_RESIZE_WIDTHS = [100, 300, 500, 750, 1000, 1500, 2500];

export const ImageRendererComponent: React.FC<ImageRendererComponentProps> = ({
    onClick,
    renderEmpty,
    value,
    link,
    linkComponent
}) => {
    const LinkComponent = linkComponent || DefaultLinkComponent;

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

        const srcSet = SUPPORTED_IMAGE_RESIZE_WIDTHS.map(item => {
            return `${src}?width=${item} ${item}w`;
        }).join(", ");

        content = <PbImg alt={title} title={title} src={src} srcSet={srcSet} onClick={onClick} />;
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
};

export const imageRendererOptions: CreateRendererOptions<Props> = {
    baseStyles: { width: "100%" },
    propsAreEqual: (prevProps: Props, nextProps: Props) => {
        return prevProps.value === nextProps.value;
    }
};

export type ImageRenderer = ReturnType<typeof createImage>;

interface Props {
    onClick?: React.MouseEventHandler<HTMLImageElement>;
    renderEmpty?: React.ReactNode;
    value?: { id: string; src: string };
    link?: { href: string; newTab?: boolean };
}

export interface CreateImageParams {
    linkComponent?: LinkComponentType;
}

export const createImage = (params: CreateImageParams = {}) => {
    return createRenderer<Props>(props => {
        return <ImageRendererComponent {...params} {...props} />;
    }, imageRendererOptions);
};
