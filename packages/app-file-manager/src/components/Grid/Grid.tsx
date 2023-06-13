import React from "react";
import { FolderGrid } from "@webiny/app-aco";
import { i18n } from "@webiny/app/i18n";
import { CircularProgress } from "@webiny/ui/Progress";
import getFileTypePlugin from "~/getFileTypePlugin";
import FileThumbnail, { FileProps } from "./File";

import { FileList, FolderList } from "./styled";

import { FolderItem } from "@webiny/app-aco/types";
import { FileItem } from "@webiny/app/types";

const t = i18n.ns("app-admin/file-manager/components/grid");

interface GridProps {
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

export const Grid: React.FC<GridProps> = ({
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
}) => {
    if (loading) {
        return <CircularProgress label={t`Loading Files...`} style={{ opacity: 1 }} />;
    }

    return (
        <>
            <FolderList>
                <FolderGrid folders={folders} onFolderClick={onFolderClick} />
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
