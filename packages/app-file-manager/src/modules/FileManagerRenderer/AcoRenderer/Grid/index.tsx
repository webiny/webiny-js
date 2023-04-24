import React, { ReactElement } from "react";
import { FolderGrid } from "@webiny/app-aco";
import { FolderItem } from "@webiny/app-aco/types";
import { FileItem } from "@webiny/app/types";
import { i18n } from "@webiny/app/i18n";
import styled from "@emotion/styled";
import getFileTypePlugin from "~/getFileTypePlugin";
import FileThumbnail, { FileProps } from "~/modules/FileManagerRenderer/AcoRenderer/File";

import { CircularProgress } from "@webiny/ui/Progress";

const t = i18n.ns("app-admin/file-manager/file-manager-view/grid-view");

interface GridProps {
    type: string;
    records: FileItem[];
    folders: FolderItem[];
    loading?: boolean;
    onRecordClick: (id: string) => void;
    onFolderClick: (id: string) => void;
    selected: FileItem[];
    multiple?: boolean;
    toggleSelected: (file: FileItem) => void;
    onChange?: Function;
    onClose?: Function;
}

const FileList = styled("div")({
    display: "grid",
    /* define the number of grid columns */
    gridTemplateColumns: "repeat( auto-fill, minmax(200px, 1fr) )",
    columnGap: 16,
    rowGap: 16,
    margin: 16,
    marginBottom: 120
});

const FolderList = styled("div")({
    margin: 16
});

interface RenderFileProps extends Omit<FileProps, "children"> {
    file: FileItem;
    children?: React.ReactNode;
}

const renderFile: React.FC<RenderFileProps> = props => {
    const { file } = props;
    const plugin = getFileTypePlugin(file);
    if (!plugin) {
        return null;
    }

    return (
        <FileThumbnail {...props} key={file.id}>
            {plugin.render({
                /**
                 * TODO @ts-refactor
                 */
                // @ts-ignore
                file
            })}
        </FileThumbnail>
    );
};

export const Grid = (props: GridProps): ReactElement => {
    const {
        type,
        folders,
        records,
        loading,
        onRecordClick,
        onFolderClick,
        selected,
        onChange,
        onClose,
        toggleSelected,
        multiple
    } = props;

    if (loading) {
        return <CircularProgress label={t`Loading Files...`} style={{ opacity: 1 }} />;
    }

    return (
        <>
            <FolderList>
                <FolderGrid
                    type={type}
                    folders={folders}
                    onFolderClick={folder => onFolderClick(folder.id)}
                />
            </FolderList>
            <FileList>
                {records.map(record =>
                    renderFile({
                        file: record,
                        showFileDetails: onRecordClick,
                        selected: selected.some(current => current.id === record.id),
                        onSelect: async () => {
                            if (typeof onChange === "function") {
                                if (multiple) {
                                    toggleSelected(record);
                                    return;
                                }

                                await onChange(record);
                                onClose && onClose();
                            }
                        }
                    })
                )}
            </FileList>
        </>
    );
};
