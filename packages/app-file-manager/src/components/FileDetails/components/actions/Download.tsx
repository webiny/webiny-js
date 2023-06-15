import React from "react";
import { ReactComponent as DownloadIcon } from "@material-design-icons/svg/outlined/download.svg";
import { IconButton } from "@webiny/ui/Button";
import { Tooltip } from "@webiny/ui/Tooltip";
import { useFile } from "~/components/FileDetails";

export const Download = () => {
    const { file } = useFile();

    return (
        <a rel="noreferrer" target={"_blank"} href={`${file.src}?original`}>
            <Tooltip content={<span>Download</span>} placement={"bottom"}>
                <IconButton icon={<DownloadIcon style={{ margin: "0 8px 0 0" }} />} />
            </Tooltip>
        </a>
    );
};
