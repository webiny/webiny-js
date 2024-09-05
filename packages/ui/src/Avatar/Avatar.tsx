import React from "react";
import {
    Avatar as AdminUiAvatar,
    AvatarFallback as AdminUiAvatarFallback,
    AvatarImage as AdminUiAvatarImage
} from "@webiny/admin-ui";

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
    renderImage?: (props: { src?: string; alt?: string }) => React.ReactElement;

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
    const { className, style, src, alt, width, height, renderImage, fallbackText } = props;

    let renderedImage: React.ReactElement;
    if (typeof renderImage === "function") {
        renderedImage = renderImage({ src, alt });
    } else {
        renderedImage = <AdminUiAvatarImage src={src} alt={alt} width={width} height={height} />;
    }

    return (
        <AdminUiAvatar
            className={className}
            style={{ width, height, ...style }}
            image={renderedImage}
            fallback={<AdminUiAvatarFallback content={fallbackText} delayMs={0} />}
        />
    );
    // const {
    //     className,
    //     width = 38,
    //     height = 38,
    //     src,
    //     alt,
    //     fallbackText,
    //     renderImage,
    //     ...rest
    // } = props;
    //
    // let renderedImage;
    // const imageProps = { src, alt };
    // if (src) {
    //     if (typeof renderImage === "function") {
    //         renderedImage = renderImage({
    //             ...imageProps,
    //             src
    //         });
    //     } else {
    //         renderedImage = <img {...imageProps} alt={alt} src={src} />;
    //     }
    // }
    //
    // return (
    //     <div
    //         {...rest}
    //         className={classNames(avatar, className)}
    //         style={{ ...props.style, width, height }}
    //     >
    //         {props.src ? (
    //             renderedImage
    //         ) : (
    //             <div>
    //                 <span>
    //                     {fallbackText
    //                         .split(" ")
    //                         .map(word => word.charAt(0))
    //                         .join("")
    //                         .toUpperCase()}
    //                 </span>
    //             </div>
    //         )}
    //     </div>
    // );
};
