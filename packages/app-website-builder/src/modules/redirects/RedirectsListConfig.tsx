import React from "react";
import { CellRedirectType } from "~/modules/redirects/RedirectsList/components/Table/Cells/CellRedirectType.js";
import { RedirectListConfig } from "./configs/index.js";
import { DeleteFolder, EditFolder, SetFolderPermissions } from "@webiny/app-aco";
import {
    CellActions,
    CellAuthor,
    CellCreated,
    CellModified,
    CellName,
    CellEnabled,
    Delete,
    Edit,
    Move
} from "~/modules/redirects/RedirectsList/components/Table/index.js";
import {
    BulkActionDelete,
    BulkActionMove
} from "~/modules/redirects/RedirectsList/components/BulkActions/index.js";
import { FilterByStatus } from "~/modules/redirects/RedirectsList/components/Filters/index.js";

const { Browser } = RedirectListConfig;

export const RedirectsListConfig = () => {
    return (
        <>
            <RedirectListConfig>
                <Browser.Filter name={"status"} element={<FilterByStatus />} />
                <Browser.Folder.Action name={"edit"} element={<EditFolder />} />
                <Browser.Folder.Action name={"permissions"} element={<SetFolderPermissions />} />
                <Browser.Folder.Action name={"delete"} element={<DeleteFolder />} />
                <Browser.Redirect.Action name={"edit"} element={<Edit />} />
                <Browser.Redirect.Action name={"moveToFolder"} element={<Move />} />
                <Browser.Redirect.Action name={"delete"} element={<Delete />} />
                <Browser.BulkAction name={"moveRedirects"} element={<BulkActionMove />} />
                <Browser.BulkAction name={"deleteRedirects"} element={<BulkActionDelete />} />
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
                    className={"text-right"}
                />
            </RedirectListConfig>
        </>
    );
};
