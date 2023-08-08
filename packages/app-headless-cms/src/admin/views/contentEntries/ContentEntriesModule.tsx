import React from "react";
import { ContentEntryEditorConfig, ContentEntryListConfig } from "~/admin/config/contentEntries";

import { ActionPublish, ActionUnpublish } from "~/admin/components/ContentEntries/BulkActions";
import { FilterByStatus } from "~/admin/components/ContentEntries/Filters";
import {
    DeleteEntry,
    SaveAndPublishButton,
    SaveContentButton
} from "~/admin/components/ContentEntryForm/Header";

const { Browser } = ContentEntryListConfig;
const { Actions } = ContentEntryEditorConfig;

export const ContentEntriesModule: React.FC = () => {
    return (
        <>
            <ContentEntryListConfig>
                <Browser.Filter name={"status"} element={<FilterByStatus />} />
                <Browser.BulkAction name={"publish"} element={<ActionPublish />} />
                <Browser.BulkAction name={"unpublish"} element={<ActionUnpublish />} />
            </ContentEntryListConfig>
            <ContentEntryEditorConfig>
                <Actions.ButtonAction name={"save"} element={<SaveContentButton />} />
                <Actions.ButtonAction name={"publish"} element={<SaveAndPublishButton />} />
                <Actions.MenuItemAction name={"delete"} element={<DeleteEntry />} />
            </ContentEntryEditorConfig>
        </>
    );
};
