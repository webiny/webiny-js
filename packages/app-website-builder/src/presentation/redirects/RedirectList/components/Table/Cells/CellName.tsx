import React from "react";
import { Icon, Text } from "@webiny/admin-ui";
import { ReactComponent as File } from "@webiny/icons/description.svg";
import { ReactComponent as Folder } from "@webiny/icons/folder.svg";
import { ReactComponent as FolderShared } from "@webiny/icons/folder_shared.svg";
import type { FolderTableRow } from "@webiny/app-aco";
import { usePermissions } from "~/presentation/security/usePermissions.js";
import type { RedirectTableRow } from "../TableRowMapper.js";
import { useRedirectListPresenter } from "~/presentation/redirects/RedirectList/index.js";
import { RedirectListConfig } from "~/presentation/redirects/RedirectList/index.js";

interface DocumentCellRowTitleProps {
    document: RedirectTableRow["data"];
}

const DocumentCellRowTitle = ({ document }: DocumentCellRowTitleProps) => {
    const { actions } = useRedirectListPresenter();
    const permissions = usePermissions();

    return (
        <div className={"flex flex-col gap-y-[3px]"}>
            <div
                className={"flex w-full items-center cursor-pointer"}
                onClick={() => {
                    if (permissions.canEdit("redirect")) {
                        actions.showEditDialog(document.id);
                    }
                }}
            >
                <Icon
                    size={"sm"}
                    color={"neutral-strong"}
                    className={"mr-xs"}
                    icon={<File />}
                    label={`Redirect - ${document.title}`}
                />
                <Text as={"div"} className={"truncate min-w-0 shrink"}>
                    {document.title}
                </Text>
            </div>
        </div>
    );
};

interface EntryCellNameProps {
    document: RedirectTableRow["data"];
}

export const DocumentCellName = ({ document }: EntryCellNameProps) => {
    return <DocumentCellRowTitle document={document} />;
};

const RedirectFolderCellName = ({ folder }: { folder: FolderTableRow["data"] }) => {
    const { actions } = useRedirectListPresenter();

    let icon = <Folder />;
    if (folder.hasNonInheritedPermissions && folder.canManagePermissions) {
        icon = <FolderShared />;
    }

    return (
        <div
            className={
                "flex items-center gap-sm truncate cursor-pointer font-semibold hover:underline"
            }
            onClick={() => actions.folders.selectFolder(folder.id)}
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

export const CellName = () => {
    const { useTableRow, isFolderRow } = RedirectListConfig.Browser.Table.Column;
    const { row } = useTableRow();

    if (isFolderRow(row)) {
        return <RedirectFolderCellName folder={row.data} />;
    }

    return <DocumentCellName document={row.data} />;
};
