import React from "react";
import { css } from "emotion";
import classNames from "classnames";
const avatar = css({
    borderRadius: "50%",
    display: "block",
    //alignItems: "center",
    //justifyContent: "center",
    width: 38,
    height: 38,
    position: "relative",
    top: -7,
    right: 7,
    overflow: "hidden",
    background: "var(--mdc-theme-background)",
    color: "var(--mdc-theme-text-secondary-on-background)",
    div: {
        textAlign: "center",
        display: "flex",
        alignContent: "center",
        justifyContent: "center",
        flexDirection: "column",
        width: 38,
        height: 38,
        fontSize: "1rem",
        span: {
            paddingBottom: 2
        }
    },
    img: {
        width: "100% !important",
        height: "100% !important",
        objectFit: "cover"
    }
});

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
    src?: string | null;

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
 * Use Avatar component to display user's avatar.
 */
export const Avatar = (props: AvatarProps) => {
    const { className, width, height, src, alt, fallbackText, renderImage, ...rest } = props;

    let renderedImage;
    const imageProps = { src, alt };
    if (src) {
        if (typeof renderImage === "function") {
            renderedImage = renderImage({
                ...imageProps,
                src
            });
        } else {
            renderedImage = <img {...imageProps} alt={alt} src={src} />;
        }
    }

    return (
        <div
            {...rest}
            className={classNames(avatar, className)}
            style={{ ...props.style, width, height }}
        >
            {props.src ? (
                renderedImage
            ) : (
                <div>
                    <span>
                        {fallbackText
                            .split(" ")
                            .map(word => word.charAt(0))
                            .join("")
                            .toUpperCase()}
                    </span>
                </div>
            )}
        </div>
    );
};

Avatar.defaultProps = {
    width: 38,
    height: 38
};
