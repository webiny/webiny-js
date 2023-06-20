import React, { useMemo } from "react";
import bytes from "bytes";
import styled from "@emotion/styled";
import { ReactComponent as ImageIcon } from "@material-design-icons/svg/outlined/insert_photo.svg";
import { ReactComponent as FileIcon } from "@material-design-icons/svg/outlined/insert_drive_file.svg";
import { Icon } from "@webiny/ui/Icon";
import { Typography } from "@webiny/ui/Typography";
import { useFile } from "~/hooks/useFile";

const TypeAndSizeWrapper = styled.div`
    display: flex;
    align-items: center;
`;

const InlineIcon = styled(Icon)`
    margin-right: 5px;
    &.mdc-button__icon {
        display: inline;
        fill: var(--mdc-theme-text-secondary-on-background);
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
        <TypeAndSizeWrapper>
            <InlineIcon icon={fileTypeIcon} />
            <Typography use={"caption"}>{file.type}</Typography>
            <span>&nbsp;-&nbsp;</span>
            <Typography use={"caption"} tag={"span"}>
                {bytes.format(file.size, {
                    unitSeparator: " "
                })}
            </Typography>
        </TypeAndSizeWrapper>
    );
};
