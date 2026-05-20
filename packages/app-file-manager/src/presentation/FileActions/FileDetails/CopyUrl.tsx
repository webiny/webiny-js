import React from "react";
import { ReactComponent as CopyContentIcon } from "@webiny/icons/content_copy.svg";
import { useCopyFile } from "~/presentation/hooks/useCopyFile.js";
import { FileManagerViewConfig, useFile } from "~/index.js";

const { FileDetails } = FileManagerViewConfig;

export const CopyUrl = () => {
    const { file } = useFile();
    const { copyFileUrl } = useCopyFile({ file });

    return (
        <FileDetails.Action.Button
            label={"Copy URL"}
            onAction={copyFileUrl}
            icon={<CopyContentIcon />}
        />
    );
};
