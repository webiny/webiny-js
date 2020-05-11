import * as React from "react";
import { AdminFileManagerFileTypePlugin } from "@webiny/app-admin/types";
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

const plugin: AdminFileManagerFileTypePlugin = {
    name: "file-manager-file-type-default",
    type: "admin-file-manager-file-type",
    render() {
        return (
            <div className={style.centering}>
                <FileIcon />
            </div>
        );
    }
};


export default plugin;
