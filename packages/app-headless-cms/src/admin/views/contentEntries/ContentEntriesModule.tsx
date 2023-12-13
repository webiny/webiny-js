import React from "react";
import { ContentEntryEditorConfig, ContentEntryListConfig } from "~/admin/config/contentEntries";

import {
    ActionDelete,
    ActionMove,
    ActionPublish,
    ActionUnpublish
} from "~/admin/components/ContentEntries/BulkActions";
import { FilterByStatus } from "~/admin/components/ContentEntries/Filters";
import {
    DeleteEntry as DeleteEntryMenuItem,
    SaveAndPublishButton,
    SaveContentButton
} from "~/admin/components/ContentEntryForm/Header";
import { DeleteFolder, EditFolder, SetFolderPermissions } from "@webiny/app-aco";
import {
    ChangeEntryStatus,
    DeleteEntry,
    EditEntry,
    MoveEntry
} from "~/admin/components/ContentEntries/Table/Actions";
import {
    CellActions,
    CellAuthor,
    CellModified,
    CellName,
    CellStatus
} from "~/admin/components/ContentEntries/Table/Cells";

const { Browser } = ContentEntryListConfig;
const { Actions } = ContentEntryEditorConfig;

export const ContentEntriesModule = () => {
    return (
        <>
            <ContentEntryListConfig>
                <Browser.Filter name={"status"} element={<FilterByStatus />} />
                <Browser.BulkAction name={"publish"} element={<ActionPublish />} />
                <Browser.BulkAction name={"unpublish"} element={<ActionUnpublish />} />
                <Browser.BulkAction name={"move"} element={<ActionMove />} />
                <Browser.BulkAction name={"delete"} element={<ActionDelete />} />
                <Browser.FolderAction name={"edit"} element={<EditFolder />} />
                <Browser.FolderAction name={"permissions"} element={<SetFolderPermissions />} />
                <Browser.FolderAction name={"delete"} element={<DeleteFolder />} />
                <Browser.EntryAction name={"edit"} element={<EditEntry />} />
                <Browser.EntryAction name={"status"} element={<ChangeEntryStatus />} />
                <Browser.EntryAction name={"move"} element={<MoveEntry />} />
                <Browser.EntryAction name={"delete"} element={<DeleteEntry />} />
                <Browser.Table.Column
                    name={"name"}
                    header={"Name"}
                    cell={<CellName />}
                    sortable={true}
                    size={400}
                    className={"cms-aco-list-title"}
                />
                <Browser.Table.Column
                    name={"createdBy"}
                    header={"Author"}
                    cell={<CellAuthor />}
                    className={"cms-aco-list-createdBy"}
                />
                <Browser.Table.Column
                    name={"savedOn"}
                    header={"Modified"}
                    cell={<CellModified />}
                    sortable={true}
                    className={"cms-aco-list-savedOn"}
                />
                <Browser.Table.Column
                    name={"status"}
                    header={"Status"}
                    cell={<CellStatus />}
                    className={"cms-aco-list-status"}
                />
                <Browser.Table.Column
                    name={"actions"}
                    header={" "}
                    cell={<CellActions />}
                    size={60}
                    resizable={false}
                    className={"rmwc-data-table__cell--align-end cms-aco-list-actions"}
                />
            </ContentEntryListConfig>
            <ContentEntryEditorConfig>
                <Actions.ButtonAction name={"save"} element={<SaveContentButton />} />
                <Actions.ButtonAction name={"publish"} element={<SaveAndPublishButton />} />
                <Actions.MenuItemAction name={"delete"} element={<DeleteEntryMenuItem />} />
            </ContentEntryEditorConfig>
        </>
    );
};
