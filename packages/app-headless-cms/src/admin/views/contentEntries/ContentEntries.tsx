import React from "react";
import { Table as CmsAcoTable } from "./Table";
import { useModel } from "~/admin/components/ModelProvider";
import { ContentEntriesProvider } from "~/admin/views/contentEntries/ContentEntriesContext";

export const ContentEntries: React.FC = () => {
    const { model } = useModel();

    return (
        <ContentEntriesProvider contentModel={model} key={model.modelId}>
            <CmsAcoTable />
        </ContentEntriesProvider>
    );
};
