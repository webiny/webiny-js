import React from "react";
/**
 * Package react-lazy-load has no types.
 */
// @ts-ignore
import LazyLoad from "react-lazy-load";
/**
 * Package timeago-react does not have types.
 */
// @ts-ignore
import TimeAgo from "timeago-react";
import { ButtonSecondary } from "@webiny/ui/Button";
import { Ripple } from "@webiny/ui/Ripple";
import { IconButton } from "@webiny/ui/Button";
import { Typography } from "@webiny/ui/Typography";
import { ReactComponent as SettingsIcon } from "@material-design-icons/svg/filled/settings.svg";
import { ReactComponent as DownloadIcon } from "@material-design-icons/svg/filled/download.svg";
import { ReactComponent as MoveIcon } from "@material-design-icons/svg/filled/drive_file_move.svg";
import { ReactComponent as SelectIcon } from "@material-design-icons/svg/filled/check_box_outline_blank.svg";
import { ReactComponent as SelectedIcon } from "@material-design-icons/svg/filled/check_box.svg";
import { ReactComponent as SelectedMarker } from "@material-design-icons/svg/outlined/check_circle.svg";

import { FileItem } from "@webiny/app-admin/types";

import {
    FileBody,
    FileClickable,
    FileInfoIcon,
    FileControls,
    FileSelectedMarker,
    FileLabel,
    FilePreview,
    FileWrapper
} from "./styled";

export interface FileProps {
    file: FileItem;
    selected: boolean;
    onSelect?: (event?: React.MouseEvent) => void;
    onClick?: (event?: React.MouseEvent) => void;
    options?: Array<{ label: string; onClick: (file: Object) => void }>;
    multiple: boolean;
    children: React.ReactNode;
    showFileDetails: (id: string) => void;
}

const File: React.FC<FileProps> = ({
    file,
    selected,
    onSelect,
    children,
    showFileDetails,
    multiple
}) => {
    let ctaIcon = null;
    if (multiple) {
        ctaIcon = selected ? <SelectedIcon /> : <SelectIcon />;
    }

    return (
        <FileWrapper data-testid={"fm-list-wrapper-file"}>
            <FileBody>
                <FileControls>
                    <FileInfoIcon>
                        <IconButton icon={<DownloadIcon />} />
                        <IconButton icon={<MoveIcon />} />
                        <IconButton
                            icon={<SettingsIcon />}
                            onClick={() => showFileDetails(file.id)}
                            data-testid={"fm-file-wrapper-file-info-icon"}
                        />
                    </FileInfoIcon>
                </FileControls>
                {selected && (
                    <FileSelectedMarker>
                        <SelectedMarker />
                    </FileSelectedMarker>
                )}
                <LazyLoad height={200} offsetVertical={300}>
                    <Ripple>
                        <FilePreview data-testid={"fm-file-wrapper-file-preview"}>
                            <FileClickable />
                            {children}
                        </FilePreview>
                    </Ripple>
                </LazyLoad>
            </FileBody>
            <FileLabel data-testid={"fm-file-wrapper-file-label"}>
                <Typography className="type" use={"overline"}>
                    {file.type}
                </Typography>
                <Typography className="name" use={"body2"}>
                    {file.name}
                </Typography>
                <Typography className="createdOn" use={"caption"}>
                    <TimeAgo datetime={file.createdOn} />
                </Typography>
            </FileLabel>
            {onSelect && (
                <ButtonSecondary onClick={onSelect}>
                    {ctaIcon}
                    <span>{selected ? "Selected" : "Select"}</span>
                </ButtonSecondary>
            )}
        </FileWrapper>
    );
};

const MemoizedFile = React.memo(File, (prev, next) => {
    if (prev.selected !== next.selected) {
        return false;
    } else if (prev.file.name !== next.file.name) {
        return false;
    }

    return true;
});

MemoizedFile.displayName = "FileThumbnail";
export const FileThumbnail = MemoizedFile;
