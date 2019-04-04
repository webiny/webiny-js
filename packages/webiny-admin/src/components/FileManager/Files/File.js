// @flow
import React from "react";
import { css } from "emotion";

const styles = css({
    border: "1px solid red",
    width: 240,
    height: 240,
    display: "inline-block",
    margin: 10,
    cursor: "pointer",
    float: "left",
    overflow: "hidden",
    img: {
        width: "100%"
    }
});

type Props = {
    file: Object
};

export default function File({ file }: Props) {
    return (
        <div className={styles}>
            <img src={file.src} alt="" />
        </div>
    );
}
