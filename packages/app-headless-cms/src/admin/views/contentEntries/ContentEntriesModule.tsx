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
    DeleteEntry,
    SaveAndPublishButton,
    SaveContentButton
} from "~/admin/components/ContentEntryForm/Header";
import { AcoListConfig, DeleteFolder, EditFolder, SetFolderPermissions } from "@webiny/app-aco";

const { Folder } = AcoListConfig;
const { Browser } = ContentEntryListConfig;
const { Actions } = ContentEntryEditorConfig;

export const ContentEntriesModule: React.FC = () => {
    return (
        <>
            <ContentEntryListConfig>
                <Browser.Filter name={"status"} element={<FilterByStatus />} />
                <Browser.BulkAction name={"publish"} element={<ActionPublish />} />
                <Browser.BulkAction name={"unpublish"} element={<ActionUnpublish />} />
                <Browser.BulkAction name={"move"} element={<ActionMove />} />
                <Browser.BulkAction name={"delete"} element={<ActionDelete />} />
            </ContentEntryListConfig>
            <ContentEntryEditorConfig>
                <Actions.ButtonAction name={"save"} element={<SaveContentButton />} />
                <Actions.ButtonAction name={"publish"} element={<SaveAndPublishButton />} />
                <Actions.MenuItemAction name={"delete"} element={<DeleteEntry />} />
            </ContentEntryEditorConfig>
            <AcoListConfig>
                <Folder.Action name={"edit"} element={<EditFolder />} />
                <Folder.Action name={"permissions"} element={<SetFolderPermissions />} />
                <Folder.Action name={"delete"} element={<DeleteFolder />} />
            </AcoListConfig>
        </>
    );
};
