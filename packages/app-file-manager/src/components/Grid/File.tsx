import React from "react";
/**
 * Package react-lazy-load has no types.
 */
// @ts-ignore
import LazyLoad from "react-lazy-load";
import { Ripple } from "@webiny/ui/Ripple";
import { IconButton } from "@webiny/ui/Button";
import { ReactComponent as SettingsIcon } from "@material-design-icons/svg/outlined/settings.svg";
import { FileItem } from "@webiny/app-admin/types";

import {
    FileBody,
    FileClickable,
    FileInfoIcon,
    FileLabel,
    FilePreview,
    FileWrapper
} from "./styled";

export interface FileProps {
    file: FileItem;
    selected: boolean;
    onSelect: (event?: React.MouseEvent) => void;
    onClick?: (event?: React.MouseEvent) => void;
    options?: Array<{ label: string; onClick: (file: Object) => void }>;
    children: React.ReactNode;
    showFileDetails: (id: string) => void;
}

const File: React.FC<FileProps> = ({ file, selected, onSelect, children, showFileDetails }) => {
    return (
        <FileWrapper
            selected={selected}
            disableSelect={!onSelect}
            data-testid={"fm-list-wrapper-file"}
        >
            <FileBody>
                <FileInfoIcon>
                    <IconButton
                        icon={<SettingsIcon />}
                        onClick={() => showFileDetails(file.id)}
                        data-testid={"fm-file-wrapper-file-info-icon"}
                    />
                </FileInfoIcon>
                <LazyLoad height={200} offsetVertical={300}>
                    <Ripple>
                        <FilePreview data-testid={"fm-file-wrapper-file-preview"}>
                            <FileClickable onClick={onSelect} />
                            {children}
                        </FilePreview>
                    </Ripple>
                </LazyLoad>
            </FileBody>
            <FileLabel onClick={onSelect} data-testid={"fm-file-wrapper-file-label"}>
                {file.name}
            </FileLabel>
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

MemoizedFile.displayName = "MemoizedFile";
export default MemoizedFile;
