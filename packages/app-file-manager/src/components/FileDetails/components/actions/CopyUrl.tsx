import React from "react";
import { ReactComponent as CopyContentIcon } from "@material-design-icons/svg/outlined/content_copy.svg";
import { IconButton } from "@webiny/ui/Button";
import { Tooltip } from "@webiny/ui/Tooltip";
import { useCopyFile } from "~/hooks/useCopyFile";
import { useFile } from "~/hooks/useFile";

export const CopyUrl = () => {
    const { file } = useFile();
    const { copyFileUrl } = useCopyFile({ file });

    return (
        <Tooltip content={<span>Copy URL</span>} placement={"bottom"}>
            <IconButton
                onClick={copyFileUrl}
                icon={<CopyContentIcon style={{ margin: "0 8px 0 0" }} />}
            />
        </Tooltip>
    );
};
