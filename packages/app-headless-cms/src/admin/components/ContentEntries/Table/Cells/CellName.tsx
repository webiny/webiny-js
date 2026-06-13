import React from "react";
import type { FolderDto } from "@webiny/app-aco";

import { Icon, Text } from "@webiny/admin-ui";
import { ReactComponent as Folder } from "@webiny/icons/folder.svg";
import { ReactComponent as FolderShared } from "@webiny/icons/folder_shared.svg";
import { ReactComponent as File } from "@webiny/icons/description.svg";

import { ContentEntryListConfig } from "~/admin/config/contentEntries/index.js";
import { useContentEntriesPresenter } from "~/presentation/contentEntries/list/useContentEntriesPresenter.js";
import { usePermission } from "~/admin/hooks/index.js";

import type { CmsContentEntry } from "~/types.js";

interface FolderCellNameProps {
    folder: FolderDto;
}

export const FolderCellName = ({ folder }: FolderCellNameProps) => {
    const presenter = useContentEntriesPresenter();

    let icon = <Folder />;
    if (folder.hasNonInheritedPermissions && folder.canManagePermissions) {
        icon = <FolderShared />;
    }

    return (
        <div
            className={
                "flex items-center gap-sm truncate cursor-pointer font-semibold hover:underline"
            }
            onClick={() => presenter.folders.selectFolder(folder.id)}
        >
            <Icon
                size={"sm"}
                color={"neutral-strong"}
                icon={icon}
                label={`Folder - ${folder.title}`}
            />
            <Text className={"truncate min-w-0 shrink"}>{folder.title}</Text>
        </div>
    );
};

interface EntryCellRowTitleProps {
    entry: CmsContentEntry;
}

const EntryCellRowTitle = ({ entry }: EntryCellRowTitleProps) => {
    return (
        <div className={"flex items-center gap-sm truncate"}>
            <Icon
                size={"sm"}
                color={"neutral-strong"}
                icon={<File />}
                label={`Entry - ${entry.meta.title}`}
            />
            <Text className={"truncate min-w-0 shrink"}>{entry.meta.title}</Text>
        </div>
    );
};

interface EntryCellNameProps {
    entry: CmsContentEntry;
}

export const EntryCellName = ({ entry }: EntryCellNameProps) => {
    const presenter = useContentEntriesPresenter();
    const { canEdit } = usePermission();

    if (!canEdit(entry, "cms.contentEntry")) {
        return <EntryCellRowTitle entry={entry} />;
    }

    return (
        <div
            className={"truncate cursor-pointer hover:underline"}
            onClick={() => presenter.selectEntry(entry.id)}
        >
            <EntryCellRowTitle entry={entry} />
        </div>
    );
};

export const CellName = () => {
    const { useTableRow, isFolderRow } = ContentEntryListConfig.Browser.Table.Column;
    const { row } = useTableRow();

    if (isFolderRow(row)) {
        return <FolderCellName folder={row.data} />;
    }

    return <EntryCellName entry={row.data} />;
};
