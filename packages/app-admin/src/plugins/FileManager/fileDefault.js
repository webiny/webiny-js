// @flow
import React from "react";
import { ReactComponent as FileIcon } from "./icons/round-description-24px.svg";

import { css } from "emotion";
const style = {
    centering: css({
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: 200
    })
};

export default {
    name: "file-manager-file-type-default",
    type: "file-manager-file-type",
    render() {
        return (
            <div className={style.centering}>
                <FileIcon />
            </div>
        );
    }
};
