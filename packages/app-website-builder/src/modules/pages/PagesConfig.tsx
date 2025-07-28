import React from "react";
import { PageListConfig } from "~/configs";
import { DeleteFolder, EditFolder, SetFolderPermissions } from "@webiny/app-aco";
import {
    CellActions,
    CellAuthor,
    CellCreated,
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
import { StaticPageForm } from "~/modules/pages/PagesList/components/Main/CreatePage/StaticPageForm";

const { Browser } = PageListConfig;

export const PagesConfig = () => {
    return (
        <>
            <PageListConfig>
                <PageListConfig.PageType
                    name={"static"}
                    label={"Static Page"}
                    element={<StaticPageForm />}
                />
                <Browser.Filter name={"status"} element={<FilterByStatus />} />
                <Browser.Folder.Action name={"edit"} element={<EditFolder />} />
                <Browser.Folder.Action name={"permissions"} element={<SetFolderPermissions />} />
                <Browser.Folder.Action name={"delete"} element={<DeleteFolder />} />
                <Browser.Page.Action name={"edit"} element={<Edit />} />
                <Browser.Page.Action name={"changeStatus"} element={<ChangeStatus />} />
                <Browser.Page.Action name={"duplicate"} element={<Duplicate />} />
                <Browser.Page.Action name={"moveToFolder"} element={<Move />} />
                <Browser.Page.Action name={"delete"} element={<Delete />} />
                <Browser.BulkAction name={"publishPages"} element={<BulkActionPublish />} />
                <Browser.BulkAction name={"unpublishPages"} element={<BulkActionUnpublish />} />
                <Browser.BulkAction name={"duplicatePages"} element={<BulkActionDuplicate />} />
                <Browser.BulkAction name={"movePages"} element={<BulkActionMovePage />} />
                <Browser.BulkAction name={"deletePages"} element={<BulkActionDelete />} />
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
                <Browser.Table.Column
                    name={"actions"}
                    header={""}
                    cell={<CellActions />}
                    size={56}
                    resizable={false}
                    hideable={false}
                    className={"wby-text-right"}
                />
            </PageListConfig>
        </>
    );
};
