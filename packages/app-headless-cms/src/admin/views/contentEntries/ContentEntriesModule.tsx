import React from "react";
import { Plugin } from "@webiny/app-admin";

import { ContentEntryEditorConfig, ContentEntryListConfig } from "~/admin/config/contentEntries";

import { FilterByStatus } from "~/admin/components/ContentEntries/Filters";
import {
    DeleteItem,
    RevisionSelector,
    SaveAndPublishButton,
    SaveContentButton
} from "~/admin/components/ContentEntryForm/Header";

const { Browser } = ContentEntryListConfig;
const { Form } = ContentEntryEditorConfig;

export const ContentEntriesModule: React.FC = () => {
    return (
        <>
            <Plugin>
                <ContentEntryListConfig>
                    <Browser.Filter name={"status"} element={<FilterByStatus />} />
                </ContentEntryListConfig>
                <ContentEntryEditorConfig>
                    <Form.Action name={"save"} element={<SaveContentButton />} />
                    <Form.Action name={"publish"} element={<SaveAndPublishButton />} />
                    <Form.Action name={"delete"} element={<DeleteItem />} position={"tertiary"} />
                    <Form.Action
                        name={"revisions-selector"}
                        element={<RevisionSelector />}
                        position={"secondary"}
                    />
                </ContentEntryEditorConfig>
            </Plugin>
        </>
    );
};
