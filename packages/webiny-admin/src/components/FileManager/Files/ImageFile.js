// @flow
import React from "react";
import { css } from "emotion";

const styles = css({
    border: "1px solid red"
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
