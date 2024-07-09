import React, { Fragment } from "react";
/**
 * Package react-lazy-load has no types.
 */
// @ts-expect-error
import LazyLoad from "react-lazy-load";
import { TimeAgo } from "@webiny/ui/TimeAgo";
import { Typography } from "@webiny/ui/Typography";

import { ReactComponent as SelectedMarker } from "@material-design-icons/svg/filled/check_circle.svg";

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
import { useFileManagerViewConfig } from "~/modules/FileManagerRenderer/FileManagerView/FileManagerViewConfig";

export interface FileOptions {
    label: string;
    // TODO fix the type!
    onClick: (file: boolean) => void;
}
export interface FileProps {
    file: FileItem;
    selected: boolean;
    onSelect?: (event?: React.MouseEvent) => void;
    onClick?: (event?: React.MouseEvent) => void;
    options?: FileOptions[];
    multiple?: boolean;
    children: React.ReactNode;
}

export const FileThumbnail = ({ file, selected, onSelect, children }: FileProps) => {
    const { browser } = useFileManagerViewConfig();

    const { itemActions } = browser.grid;

    return (
        <FileWrapper data-testid={"fm-list-wrapper-file"}>
            <FileBody>
                <FileControls>
                    <FileInfoIcon>
                        {itemActions.map(action => {
                            return <Fragment key={action.name}>{action.element}</Fragment>;
                        })}
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
                <Typography className="type" use={"overline"} tag={"span"}>
                    {file.type}
                </Typography>
                <Typography className="name" use={"body2"} tag={"span"}>
                    {file.name}
                </Typography>
                <Typography className="createdOn" use={"caption"} tag={"span"}>
                    <TimeAgo datetime={file.createdOn} />
                </Typography>
            </FileLabel>
        </FileWrapper>
    );
};
