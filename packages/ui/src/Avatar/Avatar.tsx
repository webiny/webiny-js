import React from "react";
import { Avatar as AdminUiAvatar } from "@webiny/admin-ui";

export interface AvatarProps {
    /**
     * CSS class name.
     */
    className?: string;

    /**
     * Style object.
     */
    style?: React.CSSProperties;

    /**
     * Avatar image source.
     */
    src?: string;

    /**
     * "alt" text.
     */
    alt?: string;

    /**
     * Width.
     */
    width?: number;

    /**
     * Height.
     */
    height?: number;

    /**
     * Pass a custom image component to be rendered instead of a simple <img> element.
     * @param props
     */
    renderImage?: (props: { src: string; alt?: string }) => React.ReactElement;

    /**
     * Text that will be shown when there is no image (usually user's initials).
     */
    fallbackText: string;
}

/**
 * @deprecated This component is deprecated and will be removed in future releases.
 * Please use the `Avatar` component from the `@webiny/admin-ui` package instead.
 */
export const Avatar = (props: AvatarProps) => {
    // Note that we're ignoring `renderImage` prop, as it's not supported in the new `Avatar` component.
    const { className, style, src, alt, width, height, fallbackText } = props;

    return (
        <AdminUiAvatar
            className={className}
            style={{ width, height, ...style }}
            image={<AdminUiAvatar.Image src={src} alt={alt} width={width} height={height} />}
            fallback={<AdminUiAvatar.Fallback delayMs={0}>{fallbackText}</AdminUiAvatar.Fallback>}
        />
    );
};
