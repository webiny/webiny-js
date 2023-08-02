import React, { useCallback } from "react";
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
import { IconButton } from "@webiny/ui/Button";
import { Typography } from "@webiny/ui/Typography";
import { ReactComponent as SettingsIcon } from "@material-design-icons/svg/filled/settings.svg";
import { ReactComponent as DownloadIcon } from "@material-design-icons/svg/filled/download.svg";
import { ReactComponent as MoveIcon } from "@material-design-icons/svg/filled/drive_file_move.svg";
import { ReactComponent as SelectedMarker } from "@material-design-icons/svg/filled/check_circle.svg";

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
import { useMoveFileToFolder } from "~/hooks/useMoveFileToFolder";
import { useFile } from "~/hooks/useFile";

export interface FileProps {
    selected: boolean;
    onSelect?: (event?: React.MouseEvent) => void;
    onClick?: (event?: React.MouseEvent) => void;
    options?: Array<{ label: string; onClick: (file: Object) => void }>;
    multiple?: boolean;
    children: React.ReactNode;
    showFileDetails: (id: string) => void;
}

export const FileThumbnail: React.FC<FileProps> = ({
    selected,
    onSelect,
    children,
    showFileDetails
}) => {
    const { file } = useFile();

    const showDetails = useCallback(() => {
        showFileDetails(file.id);
    }, [file.id]);

    const moveToFolder = useMoveFileToFolder(file);

    return (
        <FileWrapper data-testid={"fm-list-wrapper-file"}>
            <FileBody>
                <FileControls>
                    <FileInfoIcon>
                        <a rel="noreferrer" target={"_blank"} href={`${file.src}?original`}>
                            <IconButton icon={<DownloadIcon />} />
                        </a>
                        <IconButton icon={<MoveIcon />} onClick={moveToFolder} />
                        <IconButton
                            icon={<SettingsIcon />}
                            onClick={showDetails}
                            data-testid={"fm-file-wrapper-file-info-icon"}
                        />
                    </FileInfoIcon>
                    {onSelect ? (
                        <FileSelectedMarker
                            className={selected ? "selected" : ""}
                            onClick={onSelect}
                        >
                            <div>
                                <SelectedMarker />
                            </div>
                        </FileSelectedMarker>
                    ) : null}
                </FileControls>
                <LazyLoad height={200} offsetVertical={300}>
                    <FilePreview
                        data-testid={"fm-file-wrapper-file-preview"}
                        className={selected ? "selected" : ""}
                    >
                        <FileClickable />
                        {children}
                    </FilePreview>
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
        </FileWrapper>
    );
};
