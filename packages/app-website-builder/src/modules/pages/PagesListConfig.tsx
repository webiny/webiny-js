import React from "react";
import { InternalPageListConfig } from "./configs/list/index.js";
import { DeleteFolder, EditFolder, SetFolderPermissions } from "@webiny/app-aco";
import {
    CellActions,
    CellAuthor,
    CellCreated,
    CellLive,
    CellModified,
    CellName,
    CellStatus,
    ChangeStatus,
    Delete,
    Duplicate,
    Edit,
    Move
} from "~/modules/pages/PagesList/components/Table/index.js";
import {
    BulkActionDelete,
    BulkActionDuplicate,
    BulkActionMovePage,
    BulkActionPublish,
    BulkActionUnpublish
} from "~/modules/pages/PagesList/components/BulkActions/index.js";
import { FilterByStatus } from "~/modules/pages/PagesList/components/Filters/index.js";
import { StaticPageForm } from "~/modules/pages/PagesList/components/Main/CreatePage/StaticPageForm.js";
import { HasPermission } from "~/presentation/security/HasPermission.js";
import { TrashBin } from "~/components/TrashBin/index.js";

const { Browser } = InternalPageListConfig;

export const PagesListConfig = () => {
    return (
        <>
            <InternalPageListConfig>
                <InternalPageListConfig.PageType
                    name={"static"}
                    label={"Static Page"}
                    element={<StaticPageForm />}
                />
                <Browser.Filter name={"status"} element={<FilterByStatus />} />
                <Browser.Folder.Action name={"edit"} element={<EditFolder />} />
                <Browser.Folder.Action name={"permissions"} element={<SetFolderPermissions />} />
                <Browser.Folder.Action name={"delete"} element={<DeleteFolder />} />
                <HasPermission entity={"page"} action={"edit"}>
                    <Browser.Page.Action name={"edit"} element={<Edit />} />
                    <Browser.Page.Action name={"moveToFolder"} element={<Move />} />
                    <Browser.BulkAction name={"movePages"} element={<BulkActionMovePage />} />
                </HasPermission>
                <Browser.Page.Action name={"changeStatus"} element={<ChangeStatus />} />
                <HasPermission entity={"page"} action={"create"}>
                    <Browser.Page.Action name={"duplicate"} element={<Duplicate />} />
                    <Browser.BulkAction name={"duplicatePages"} element={<BulkActionDuplicate />} />
                </HasPermission>
                <HasPermission entity={"page"} action={"delete"}>
                    <Browser.Page.Action name={"delete"} element={<Delete />} />
                    <Browser.BulkAction name={"deletePages"} element={<BulkActionDelete />} />
                </HasPermission>
                <HasPermission entity={"page"} action={"publish"}>
                    <Browser.BulkAction name={"publishPages"} element={<BulkActionPublish />} />
                </HasPermission>
                <HasPermission entity={"page"} action={"unpublish"}>
                    <Browser.BulkAction name={"unpublishPages"} element={<BulkActionUnpublish />} />
                </HasPermission>
                <Browser.Table.Column
                    name={"name"}
                    header={"Name"}
                    cell={<CellName />}
                    sortable={false}
                    hideable={false}
                    size={200}
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
                <Browser.Table.Column name={"status"} header={"Status"} cell={<CellStatus />} />
                <Browser.Table.Column name={"live"} header={"Live"} cell={<CellLive />} />
                <Browser.Table.Column
                    name={"actions"}
                    header={""}
                    cell={<CellActions />}
                    size={56}
                    resizable={false}
                    hideable={false}
                    className={"text-right"}
                />
                <Browser.Sidebar.Footer name={"trash-bin"} element={<TrashBin />} />
            </InternalPageListConfig>
        </>
    );
};
