import * as React from "react";
import { FileManagerFileTypePlugin } from "@webiny/app-admin/types";
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

const plugin: FileManagerFileTypePlugin = {
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


export default plugin;
