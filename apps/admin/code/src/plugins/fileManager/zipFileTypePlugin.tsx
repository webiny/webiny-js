import React from "react";
import { FileManagerFileTypePlugin } from "@webiny/app-admin/plugins/FileManagerFileTypePlugin";
import { ReactComponent as ArchiveIcon } from "./icons/archive.svg";
import "./fileManagerPlugin.scss";

export default [
    new FileManagerFileTypePlugin({
        types: ["zip", "application/zip", "application/x-zip", "application/x-zip-compressed"],
        render() {
            return (
                <div className={"zip-file-type-plugin-wrapper"}>
                    <ArchiveIcon />
                </div>
            );
        }
    })
];
