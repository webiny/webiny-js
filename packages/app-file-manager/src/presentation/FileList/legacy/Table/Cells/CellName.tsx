// @ts-nocheck
import React from "react";

import { FolderIcon, FolderSharedIcon } from "@webiny/app-aco";
import { useFileManagerView } from "~/modules/FileManagerRenderer/FileManagerViewProvider/index.js";
import { FileManagerViewConfig } from "~/presentation/config/FileManagerViewConfig.js";
import type { FolderItem } from "@webiny/app-aco/types.js";
import { cn, Text } from "@webiny/admin-ui";
import { CellThumbnail } from "./CellThumbnail.js";
import { FileProvider } from "~/presentation/contexts/FileProvider.js";
import type { FileItem } from "@webiny/app-admin/types.js";

interface DefaultProps {
    onClick: (id: string) => void;
}

interface FolderCellNameProps extends DefaultProps {
    folder: FolderItem;
}

export const FolderCellName = ({ folder, onClick }: FolderCellNameProps) => {
    let icon = <FolderIcon width={32} height={32} />;
    if (folder.hasNonInheritedPermissions && folder.canManagePermissions) {
        icon = <FolderSharedIcon width={32} height={32} />;
    }

    return (
        <div
            className={cn([
                "wby-flex wby-items-center wby-gap-md",
                "wby-truncate wby-cursor-pointer wby-font-semibold",
                "hover:wby-underline"
            ])}
            onClick={() => onClick(folder.id)}
        >
            <div className={"wby-size-xl wby-rounded-md wby-overflow-hidden wby-flex-shrink-0"}>
                {icon}
            </div>
            <Text className={"wby-truncate wby-min-w-0 wby-flex-shrink"}>{folder.title}</Text>
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
                "wby-flex wby-items-center wby-gap-md",
                "wby-truncate wby-cursor-pointer",
                "hover:wby-underline"
            ])}
            onClick={() => onClick(file.id)}
        >
            <FileProvider file={file}>
                <div
                    className={
                        "wby-size-xl wby-aspect-square wby-rounded-md wby-bg-neutral-muted wby-overflow-hidden wby-flex-shrink-0"
                    }
                >
                    <CellThumbnail />
                </div>
            </FileProvider>
            <Text className={"wby-truncate wby-min-w-0 wby-flex-shrink"}>{file.name}</Text>
        </div>
    );
};

export const CellName = () => {
    const { useTableRow, isFolderRow } = FileManagerViewConfig.Browser.Table.Column;
    const { row } = useTableRow();
    const { showFileDetails, setFolderId } = useFileManagerView();

    if (isFolderRow(row)) {
        return <FolderCellName folder={row.data} onClick={setFolderId} />;
    }

    return <FileCellName file={row.data} onClick={showFileDetails} />;
};
