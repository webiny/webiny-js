import React from "react";
import { FolderIcon, FolderSharedIcon } from "@webiny/app-aco";
import { FileManagerViewConfig } from "~/presentation/config/FileManagerViewConfig.js";
import { useFileManagerPresenter } from "~/presentation/FileList/FileManagerPresenterProvider.js";
import type { FolderDto } from "@webiny/app-aco";
import { cn, Text } from "@webiny/admin-ui";
import { CellThumbnail } from "./CellThumbnail.js";
import { FileProvider } from "~/presentation/contexts/FileProvider.js";
import type { FileItem } from "~/domain/types.js";

interface DefaultProps {
    onClick: (id: string) => void;
}

interface FolderCellNameProps extends DefaultProps {
    folder: FolderDto;
}

export const FolderCellName = ({ folder, onClick }: FolderCellNameProps) => {
    let icon = <FolderIcon width={32} height={32} />;
    if (folder.hasNonInheritedPermissions && folder.canManagePermissions) {
        icon = <FolderSharedIcon width={32} height={32} />;
    }

    return (
        <div
            className={cn([
                "flex items-center gap-md",
                "truncate cursor-pointer font-semibold",
                "hover:underline"
            ])}
            onClick={() => onClick(folder.id)}
        >
            <div className={"size-xl rounded-md overflow-hidden flex-shrink-0"}>{icon}</div>
            <Text className={"truncate min-w-0 flex-shrink"}>{folder.title}</Text>
        </div>
    );
};

interface FileCellNameProps extends DefaultProps {
    file: FileItem;
}

export const FileCellName = ({ file, onClick }: FileCellNameProps) => {
    return (
        <div
            className={cn([
                "flex items-center gap-md",
                "truncate cursor-pointer",
                "hover:underline"
            ])}
            onClick={() => onClick(file.id)}
        >
            <FileProvider file={file}>
                <div
                    className={
                        "size-xl aspect-square rounded-md bg-neutral-muted overflow-hidden flex-shrink-0"
                    }
                >
                    <CellThumbnail />
                </div>
            </FileProvider>
            <Text className={"truncate min-w-0 flex-shrink"}>{file.name}</Text>
        </div>
    );
};

export const CellName = () => {
    const { useTableRow, isFolderRow } = FileManagerViewConfig.Browser.Table.Column;
    const { row } = useTableRow();
    const { actions } = useFileManagerPresenter();

    if (isFolderRow(row)) {
        return (
            <FolderCellName
                folder={row.data}
                onClick={id => actions.folders.selectFolder(id)}
            />
        );
    }

    return <FileCellName file={row.data} onClick={id => actions.showFileDetails(id)} />;
};
