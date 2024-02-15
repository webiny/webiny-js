import React from "react";
import { PageListConfig } from "~/admin/config/pages";

import {
    SecureActionDelete,
    ActionExport,
    SecureActionMove,
    SecureActionPublish,
    SecureActionUnpublish,
    ActionDuplicate,
    SecureActionDuplicate as SecureBulkActionDuplicate
} from "~/admin/components/BulkActions";

import { DeleteFolder, EditFolder, SetFolderPermissions } from "@webiny/app-aco";
import {
    CellActions,
    CellAuthor,
    CellCreated,
    CellModified,
    CellName,
    CellStatus,
    SecureChangePageStatus,
    SecureDeletePage,
    SecureEditPage,
    SecureMovePage,
    PreviewPage,
    SecureDuplicatePage as SecureListDuplicatePage,
    DuplicatePage
} from "~/admin/components/Table/Table";

import { SecureDuplicatePage as SecurePageDetailsDuplicatePage } from "~/admin/plugins/pageDetails/header/pageOptionsMenu/DuplicatePage";

const { Browser } = PageListConfig;

export const PagesModule = () => {
    return (
        <>
            {/*Page Builder list configs*/}
            <PageListConfig>
                <Browser.BulkAction name={"export"} element={<ActionExport />} />
                <Browser.BulkAction name={"publish"} element={<SecureActionPublish />} />
                <Browser.BulkAction name={"unpublish"} element={<SecureActionUnpublish />} />
                <Browser.BulkAction name={"duplicate"} element={<ActionDuplicate />} />
                <Browser.BulkAction name={"move"} element={<SecureActionMove />} />
                <Browser.BulkAction name={"delete"} element={<SecureActionDelete />} />
                <Browser.FolderAction name={"edit"} element={<EditFolder />} />
                <Browser.FolderAction name={"permissions"} element={<SetFolderPermissions />} />
                <Browser.FolderAction name={"delete"} element={<DeleteFolder />} />
                <Browser.PageAction name={"edit"} element={<SecureEditPage />} />
                <Browser.PageAction name={"preview"} element={<PreviewPage />} />
                <Browser.PageAction name={"duplicate"} element={<DuplicatePage />} />
                <Browser.PageAction name={"status"} element={<SecureChangePageStatus />} />
                <Browser.PageAction name={"move"} element={<SecureMovePage />} />
                <Browser.PageAction name={"delete"} element={<SecureDeletePage />} />
                <Browser.Table.Column
                    name={"title"}
                    header={"Name"}
                    cell={<CellName />}
                    hideable={false}
                    size={200}
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
            {/*Page Builder decorated components*/}
            <SecureListDuplicatePage />
            <SecureBulkActionDuplicate />
            <SecurePageDetailsDuplicatePage />
        </>
    );
};
