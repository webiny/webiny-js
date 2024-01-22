import React from "react";
import { PageListConfig } from "~/admin/config/pages";

import {
    SecureActionDelete,
    ActionExport,
    SecureActionMove,
    SecureActionPublish,
    SecureActionUnpublish
} from "~/admin/components/BulkActions";

import { DeleteFolder, EditFolder, SetFolderPermissions } from "@webiny/app-aco";
import {
    CellActions,
    CellAuthor,
    CellCreated,
    CellModified,
    CellName,
    CellStatus,
    ChangePageStatus,
    DeletePage,
    EditPage,
    MovePage,
    PreviewPage
} from "~/admin/components/Table/Table";

const { Browser } = PageListConfig;

export const PagesModule = () => {
    return (
        <PageListConfig>
            <Browser.BulkAction name={"export"} element={<ActionExport />} />
            <Browser.BulkAction name={"publish"} element={<SecureActionPublish />} />
            <Browser.BulkAction name={"unpublish"} element={<SecureActionUnpublish />} />
            <Browser.BulkAction name={"move"} element={<SecureActionMove />} />
            <Browser.BulkAction name={"delete"} element={<SecureActionDelete />} />
            <Browser.FolderAction name={"edit"} element={<EditFolder />} />
            <Browser.FolderAction name={"permissions"} element={<SetFolderPermissions />} />
            <Browser.FolderAction name={"delete"} element={<DeleteFolder />} />
            <Browser.PageAction name={"edit"} element={<EditPage />} />
            <Browser.PageAction name={"preview"} element={<PreviewPage />} />
            <Browser.PageAction name={"status"} element={<ChangePageStatus />} />
            <Browser.PageAction name={"move"} element={<MovePage />} />
            <Browser.PageAction name={"delete"} element={<DeletePage />} />
            <Browser.Table.Column
                name={"title"}
                header={"Name"}
                cell={<CellName />}
                hideable={false}
                size={300}
                sortable={true}
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
                header={" "}
                cell={<CellActions />}
                size={80}
                className={"rmwc-data-table__cell--align-end"}
                resizable={false}
                hideable={false}
            />
        </PageListConfig>
    );
};
