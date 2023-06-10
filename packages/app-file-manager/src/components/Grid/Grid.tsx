import React, { useMemo } from "react";
import { FolderGrid } from "@webiny/app-aco";
import { i18n } from "@webiny/app/i18n";
import { CircularProgress } from "@webiny/ui/Progress";
import { FileThumbnail } from "./File";
import { FileList, FolderList } from "./styled";
import { FolderItem } from "@webiny/app-aco/types";
import { FileItem } from "@webiny/app/types";
import { Thumbnail } from "~/components/FileDetails/components/Thumbnail";
import { FileProvider } from "~/components/FileDetails/FileProvider";

const t = i18n.ns("app-admin/file-manager/components/grid");

interface GridProps {
    records: FileItem[];
    folders: FolderItem[];
    loading?: boolean;
    onRecordClick: (id: string) => void;
    onFolderClick: (id: string) => void;
    selected: FileItem[];
    multiple?: boolean;
    toggleSelected: (file: FileItem) => void | undefined;
    onChange?: Function;
    onClose?: Function;
}

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

    const onSelect = useMemo(() => {
        if (!onChange) {
            return undefined;
        }

        return (record: FileItem) => () => {
            if (multiple) {
                toggleSelected(record);
                return;
            }

            onChange(record);
            onClose && onClose();
        };
    }, [onChange]);

    return (
        <>
            <FolderList>
                <FolderGrid folders={folders} onFolderClick={onFolderClick} />
            </FolderList>
            <FileList>
                {records.map(record => (
                    <FileProvider file={record} key={record.id}>
                        <FileThumbnail
                            file={record}
                            multiple={Boolean(multiple)}
                            showFileDetails={onRecordClick}
                            selected={selected.some(current => current.id === record.id)}
                            onSelect={onSelect ? onSelect(record) : undefined}
                        >
                            <Thumbnail />
                        </FileThumbnail>
                    </FileProvider>
                ))}
            </FileList>
        </>
    );
};
