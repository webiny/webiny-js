import React from "react";
import { ReactComponent as DownloadIcon } from "@webiny/icons/file_download.svg";
import { FileManagerViewConfig, useFile } from "~/index.js";

const { Browser } = FileManagerViewConfig;

export const Download = () => {
    const { file } = useFile();

    return (
        <a rel="noreferrer" target={"_blank"} href={`${file.src}?original`}>
            <Browser.Grid.Item.Action.IconButton
                icon={<DownloadIcon />}
                label={"Download file"}
                onAction={() => {
                    /* Do nothing. */
                }}
            />
        </a>
    );
};
