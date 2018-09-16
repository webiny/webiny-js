// @flow
import * as React from "react";
import { css } from "emotion";
import classNames from "classnames";
const avatar = css({
    borderRadius: "50%",
    display: "inline-block",
    width: 32,
    height: 32,
    overflow: "hidden",
    background: "#F2F2F2",
    div: {
        textAlign: "center"
    }
});

type Props = {
    // Avatar image source.
    src: string,

    // "alt" text.
    alt: string,

    // Width.
    width?: number,

    // Height.
    height?: number,

    // Text that will be shown when there is no image (usually user's initials).
    fallbackText: string
} & Object;

/**
 * Use Avatar component to display user's avatar.
 * @param props
 * @returns {*}
 * @constructor
 */
const Avatar = (props: Props) => {
    const { className, width, height, src, alt, fallbackText, ...rest } = props;

    return (
        <div
            {...rest}
            className={classNames(avatar, className)}
            style={{ ...props.style, width, height }}
        >
            {props.src ? <img src={src} alt={alt} /> : <div>{fallbackText}</div>}
        </div>
    );
};

Avatar.defaultProps = {
    width: 32,
    height: 32
};

export { Avatar };
