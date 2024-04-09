import React from "react";
import { Table as CmsAcoTable } from "./Table";
import { useModel } from "~/admin/components/ModelProvider";
import {
    ContentEntryEditorWithConfig,
    ContentEntryListWithConfig
} from "~/admin/config/contentEntries";
import { ContentEntriesProvider } from "~/admin/views/contentEntries/ContentEntriesContext";
import { AcoWithConfig } from "@webiny/app-aco";

export const ContentEntries = () => {
    const { model } = useModel();

    return (
        <ContentEntriesProvider contentModel={model} key={model.modelId}>
            <ContentEntryListWithConfig>
                <ContentEntryEditorWithConfig>
                    <AcoWithConfig>
                        <CmsAcoTable />
                    </AcoWithConfig>
                </ContentEntryEditorWithConfig>
            </ContentEntryListWithConfig>
        </ContentEntriesProvider>
    );
};
