import React from "react";
import { DialogsProvider, makeDecoratable } from "@webiny/app-admin";
import { AcoWithConfig } from "@webiny/app-aco";
import { Table as CmsAcoTable } from "./Table";
import { useModel } from "~/admin/components/ModelProvider";
import {
    ContentEntryEditorWithConfig,
    ContentEntryListWithConfig
} from "~/admin/config/contentEntries";
import { ContentEntriesProvider } from "~/admin/views/contentEntries/ContentEntriesContext";

export const ContentEntries = makeDecoratable("ContentEntries", () => {
    const { model } = useModel();

    return (
        <ContentEntriesProvider contentModel={model} key={model.modelId}>
            <ContentEntryListWithConfig>
                <ContentEntryEditorWithConfig>
                    <AcoWithConfig>
                        <DialogsProvider>
                            <CmsAcoTable />
                        </DialogsProvider>
                    </AcoWithConfig>
                </ContentEntryEditorWithConfig>
            </ContentEntryListWithConfig>
        </ContentEntriesProvider>
    );
});
