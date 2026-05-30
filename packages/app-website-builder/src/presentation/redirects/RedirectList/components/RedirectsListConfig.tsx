import React from "react";
import { DeleteFolder, EditFolder, SetFolderPermissions, CellAuthor, CellCreated, CellModified } from "@webiny/app-aco";
import {
    CellActions,
    CellName,
    CellEnabled,
    Delete,
    Edit,
    Move
} from "./Table/index.js";
import { BulkActionDelete, BulkActionMove } from "./BulkActions/index.js";
import { FilterByStatus } from "./Filters/index.js";
import { HasPermission } from "~/presentation/security/HasPermission.js";
import {RedirectListConfig} from "~/presentation/redirects/RedirectList/index.js";
import { CellRedirectType } from "./Table/Cells/CellRedirectType.js";

const { Browser } = RedirectListConfig;

export const RedirectsListConfig = () => {
    return (
        <>
            <RedirectListConfig>
                <Browser.Filter name={"status"} element={<FilterByStatus />} />
                <Browser.Folder.Action name={"edit"} element={<EditFolder />} />
                <Browser.Folder.Action name={"permissions"} element={<SetFolderPermissions />} />
                <Browser.Folder.Action name={"delete"} element={<DeleteFolder />} />
                <HasPermission entity={"redirect"} action={"edit"}>
                    <Browser.Redirect.Action name={"edit"} element={<Edit />} />
                    <Browser.Redirect.Action name={"moveToFolder"} element={<Move />} />
                    <Browser.BulkAction name={"moveRedirects"} element={<BulkActionMove />} />
                </HasPermission>
                <HasPermission entity={"redirect"} action={"delete"}>
                    <Browser.Redirect.Action name={"delete"} element={<Delete />} after={"$last"} />
                    <Browser.BulkAction name={"deleteRedirects"} element={<BulkActionDelete />} />
                </HasPermission>
                <Browser.Table.Column
                    name={"title"}
                    header={"From / To"}
                    cell={<CellName />}
                    sortable={false}
                    hideable={false}
                    size={200}
                />
                <Browser.Table.Column
                    name={"data.redirectType"}
                    header={"Type"}
                    cell={<CellRedirectType />}
                />
                <Browser.Table.Column name={"createdBy"} header={"Author"} cell={<CellAuthor />} />
                <Browser.Table.Column
                    name={"createdOn"}
                    header={"Created"}
                    cell={<CellCreated />}
                    sortable={true}
                />
                <Browser.Table.Column
                    name={"savedOn"}
                    header={"Modified"}
                    cell={<CellModified />}
                    sortable={true}
                />
                <Browser.Table.Column
                    name={"isEnabled"}
                    header={"Is Enabled?"}
                    cell={<CellEnabled />}
                    sortable={true}
                />
                <Browser.Table.Column
                    name={"actions"}
                    header={""}
                    cell={<CellActions />}
                    size={56}
                    resizable={false}
                    hideable={false}
                    truncate={false}
                    className={"flex justify-center"}
                />
            </RedirectListConfig>
        </>
    );
};
