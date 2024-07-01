import React from "react";
import { ReactComponent as DownloadIcon } from "@material-design-icons/svg/outlined/download.svg";
import { FileManagerViewConfig, useFile } from "~/index";

const { FileDetails } = FileManagerViewConfig;

export const Download = () => {
    const { file } = useFile();

    return (
        <a rel="noreferrer" target={"_blank"} href={`${file.src}?original`}>
            <FileDetails.Action.IconButton
                label={"Download"}
                icon={<DownloadIcon style={{ margin: "0 8px 0 0" }} />}
                onAction={() => {
                    /* Do nothing. */
                }}
            />
        </a>
    );
};
