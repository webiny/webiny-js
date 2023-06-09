import React, { useMemo } from "react";
import bytes from "bytes";
import styled from "@emotion/styled";
import { ReactComponent as ImageIcon } from "@material-design-icons/svg/outlined/insert_photo.svg";
import { ReactComponent as FileIcon } from "@material-design-icons/svg/outlined/insert_drive_file.svg";
import { Icon } from "@webiny/ui/Icon";
import { Typography } from "@webiny/ui/Typography";
import { useFile } from "~/components/FileDetails";

const InlineIcon = styled(Icon)`
    &.mdc-button__icon {
        display: inline;
    }
`;

export const TypeAndSize = () => {
    const { file } = useFile();

    const fileTypeIcon = useMemo(() => {
        if (file && typeof file.type === "string") {
            return file.type.includes("image") ? <ImageIcon /> : <FileIcon />;
        }
        return <ImageIcon />;
    }, [file]);

    return (
        <>
            <InlineIcon icon={fileTypeIcon} />
            <Typography use={"subtitle1"}>{file.type}</Typography>
            <span>&nbsp;-&nbsp;</span>
            <Typography use={"subtitle1"} tag={"span"}>
                {bytes.format(file.size, {
                    unitSeparator: " "
                })}
            </Typography>
        </>
    );
};
