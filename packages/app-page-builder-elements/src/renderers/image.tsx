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
    // TODO: @pavel find a better way to attach dynamic functionality
    dynamicSource?: {
        resolvedPath: string;
    };
}

export interface ImageRendererComponentProps extends Props, CreateImageParams {}

const SUPPORTED_IMAGE_RESIZE_WIDTHS = [100, 300, 500, 750, 1000, 1500, 2500];

const getImageDynamicValue = (element?: any, dynamicValue?: string) => {
    if (!dynamicValue || !element) {
        return element;
    }

    const matcher = /(www|http:|https:)+[^\s]+[\w]/;
    const isUrlValue = dynamicValue.match(matcher);
    const src = isUrlValue !== null && dynamicValue;

    const newElement = {
        ...element,
        data: {
            ...element.data,
            image: {
                file: {
                    src
                }
            }
        }
    };

    return newElement;
};

export const ImageRendererComponent = ({
    onClick,
    renderEmpty,
    value,
    link,
    linkComponent,
    dynamicSourceContext
}: ImageRendererComponentProps) => {
    const LinkComponent = linkComponent || DefaultLinkComponent;

    const { getElement, useDynamicValue } = useRenderer();

    const element = getElement<ImageElementData>();
    // TODO: find a better way to attach value to renderer
    const dynamicValue = useDynamicValue(
        dynamicSourceContext,
        element.data?.dynamicSource?.resolvedPath
    );
    const dynamicElement = getImageDynamicValue(element, dynamicValue);
    const isDynamic = Boolean(element.data.dynamicSource);

    const elementToUse = isDynamic ? dynamicElement : element;
    const isEditable = !isDynamic;

    const handleOnClick = (params: any) => {
        if (isEditable && onClick) {
            onClick(params);
        }
    };
    // TODO: end^

    let content;

    if (elementToUse?.data?.image?.file?.src) {
        // Image has its width / height set from its own settings.
        const PbImg = styled.img({
            width: elementToUse.data.image.width,
            height: elementToUse.data.image.height,
            maxWidth: "100%"
        });

        const { title } = elementToUse.data.image;
        const { src } = value || elementToUse.data.image.file;

        // If a fixed image width in pixels was set, let's filter out unneeded
        // image resize widths. For example, if 155px was set as the fixed image
        // width, then we want the `srcset` attribute to only contain 100w and 300w.
        let srcSetWidths: number[] = [];

        const imageWidth = elementToUse.data.image.width;
        if (imageWidth && imageWidth.endsWith("px")) {
            const imageWidthInt = parseInt(imageWidth);
            for (let i = 0; i < SUPPORTED_IMAGE_RESIZE_WIDTHS.length; i++) {
                const supportedResizeWidth = SUPPORTED_IMAGE_RESIZE_WIDTHS[i];
                if (imageWidthInt > supportedResizeWidth) {
                    srcSetWidths.push(supportedResizeWidth);
                } else {
                    srcSetWidths.push(supportedResizeWidth);
                    break;
                }
            }
        } else {
            // If a fixed image width was not provided, we
            // rely on all the supported image resize widths.
            srcSetWidths = SUPPORTED_IMAGE_RESIZE_WIDTHS;
        }

        const srcSet = srcSetWidths
            .map(item => {
                return `${src}?width=${item} ${item}w`;
            })
            .join(", ");

        content = (
            <PbImg alt={title} title={title} src={src} srcSet={srcSet} onClick={handleOnClick} />
        );
    } else {
        content = renderEmpty || null;
    }

    const linkProps = link || elementToUse.data?.link;
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
    dynamicSourceContext: React.Context<any>;
}

export const createImage = (params: CreateImageParams) => {
    return createRenderer<Props>(props => {
        return <ImageRendererComponent {...params} {...props} />;
    }, imageRendererOptions);
};
