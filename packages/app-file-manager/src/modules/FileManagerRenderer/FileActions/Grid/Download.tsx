import React from "react";
import { ReactComponent as DownloadIcon } from "@material-design-icons/svg/filled/download.svg";
import { FileManagerViewConfig, useFile } from "~/index";

const { Browser } = FileManagerViewConfig;

export const Download = () => {
    const { file } = useFile();

    return (
        <a rel="noreferrer" target={"_blank"} href={`${file.src}?original`}>
            <Browser.Grid.Item.Action.IconButton
                icon={<DownloadIcon />}
                onAction={() => {
                    /* Do nothing. */
                }}
            />
        </a>
    );
};
