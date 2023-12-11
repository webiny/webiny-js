import React from "react";
import { PageListConfig } from "~/admin/config/pages";

import {
    ActionDelete,
    ActionExport,
    ActionMove,
    ActionPublish,
    ActionUnpublish
} from "~/admin/components/BulkActions";
import { DeleteFolder, EditFolder, SetFolderPermissions } from "@webiny/app-aco";
import {
    CellActions,
    CellAuthor,
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

export const PagesModule: React.FC = () => {
    return (
        <PageListConfig>
            <Browser.BulkAction name={"export"} element={<ActionExport />} />
            <Browser.BulkAction name={"publish"} element={<ActionPublish />} />
            <Browser.BulkAction name={"unpublish"} element={<ActionUnpublish />} />
            <Browser.BulkAction name={"move"} element={<ActionMove />} />
            <Browser.BulkAction name={"delete"} element={<ActionDelete />} />
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
                size={400}
                sortable={true}
            />
            <Browser.Table.Column name={"author"} header={"Author"} cell={<CellAuthor />} />
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
                size={60}
                className={"rmwc-data-table__cell--align-end"}
                resizable={false}
            />
        </PageListConfig>
    );
};
