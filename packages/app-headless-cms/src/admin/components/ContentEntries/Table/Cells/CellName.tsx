import React, { useCallback, useMemo } from "react";
import type { FolderDto } from "@webiny/app-aco";

import { Icon, Text } from "@webiny/admin-ui";
import { ReactComponent as Folder } from "@webiny/icons/folder.svg";
import { ReactComponent as FolderShared } from "@webiny/icons/folder_shared.svg";
import { ReactComponent as File } from "@webiny/icons/description.svg";

import { ContentEntryListConfig } from "~/admin/config/contentEntries/index.js";
import { usePermission } from "~/admin/hooks/index.js";

import type { CmsContentEntry } from "~/types.js";
import { useContentEntriesPresenter } from "~/presentation/contentEntries/list/useContentEntriesPresenter.js";

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

    // The open entry is represented in the URL via the `id` query param, so we can
    // render a real anchor. This lets Cmd/Ctrl/middle-click open the entry in a new tab.
    const href = useMemo(() => {
        if (typeof window === "undefined") {
            return undefined;
        }
        const params = new URLSearchParams(window.location.search);
        params.set("id", entry.id);
        return `${window.location.pathname}?${params.toString()}`;
    }, [entry.id]);

    const onClick = useCallback(
        (e: React.MouseEvent) => {
            // Let the browser handle new-tab / new-window intents natively.
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
                return;
            }
            e.preventDefault();
            presenter.selectEntry(entry.id);
        },
        [presenter, entry.id]
    );

    if (!canEdit(entry, "cms.contentEntry")) {
        return <EntryCellRowTitle entry={entry} />;
    }

    return (
        <a
            href={href}
            className={"block truncate cursor-pointer hover:underline text-inherit no-underline"}
            onClick={onClick}
        >
            <EntryCellRowTitle entry={entry} />
        </a>
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
