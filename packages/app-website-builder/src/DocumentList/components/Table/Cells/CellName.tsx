import React from "react";

import { Icon, Link, Text } from "@webiny/admin-ui";
import { ReactComponent as Folder } from "@webiny/icons/folder.svg";
import { ReactComponent as FolderShared } from "@webiny/icons/folder_shared.svg";
import { ReactComponent as File } from "@webiny/icons/description.svg";
import { useNavigateFolder } from "@webiny/app-aco";

import { FolderTableItem } from "@webiny/app-aco/types";
import { PageListConfig } from "~/configs/index.js";
import type { DocumentDto } from "~/DocumentList/presenters/index.js";
import { useGetEditPageUrl } from "~/DocumentList/hooks/useGetEditPageUrl.js";

interface FolderCellNameProps {
    folder: FolderTableItem;
}

export const FolderCellName = ({ folder }: FolderCellNameProps) => {
    const { navigateToFolder } = useNavigateFolder();

    let icon = <Folder />;
    if (folder.hasNonInheritedPermissions && folder.canManagePermissions) {
        icon = <FolderShared />;
    }

    return (
        <div
            className={
                "wby-flex wby-items-center wby-gap-sm wby-truncate wby-cursor-pointer wby-font-semibold hover:wby-underline"
            }
            onClick={() => navigateToFolder(folder.id)}
        >
            <Icon
                size={"sm"}
                color={"neutral-strong"}
                icon={icon}
                label={`Folder - ${folder.title}`}
            />
            <Text className={"wby-truncate wby-min-w-0 wby-flex-shrink"}>{folder.title}</Text>
        </div>
    );
};

interface DocumentCellRowTitleProps {
    document: DocumentDto;
}

const DocumentCellRowTitle = ({ document }: DocumentCellRowTitleProps) => {
    return (
        <div className={"wby-flex wby-items-center wby-gap-sm wby-truncate"}>
            <Icon
                size={"sm"}
                color={"neutral-strong"}
                icon={<File />}
                label={`Document - ${document.title}`}
            />
            <Text className={"wby-truncate wby-min-w-0 wby-flex-shrink"}>{document.title}</Text>
        </div>
    );
};

interface EntryCellNameProps {
    document: DocumentDto;
}

export const DocumentCellName = ({ document }: EntryCellNameProps) => {
    const { getEditPageUrl } = useGetEditPageUrl();
    return (
        <Link to={getEditPageUrl(document)} variant={"secondary"} className={"wby-truncate"}>
            <DocumentCellRowTitle document={document} />
        </Link>
    );
};

export const CellName = () => {
    const { useTableRow, isFolderRow } = PageListConfig.Browser.Table.Column;
    const { row } = useTableRow();

    if (isFolderRow(row)) {
        return <FolderCellName folder={row} />;
    }

    return <DocumentCellName document={row} />;
};
