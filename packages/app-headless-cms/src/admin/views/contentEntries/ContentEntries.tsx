import React from "react";
import { LeftPanel, RightPanel, SplitView } from "@webiny/app-admin/components/SplitView";
import ContentEntriesList from "~/admin/views/contentEntries/ContentEntriesList";
import { ContentEntry } from "~/admin/views/contentEntries/ContentEntry";
import { ContentEntryProvider } from "~/admin/views/contentEntries/ContentEntry/ContentEntryContext";
import { useModel } from "~/admin/components/ModelProvider";
import { ContentEntriesProvider } from "~/admin/views/contentEntries/ContentEntriesContext";

const ContentEntries: React.FC = () => {
    const { model } = useModel();

    return (
        <ContentEntriesProvider contentModel={model} key={model.modelId}>
            <SplitView>
                <LeftPanel span={4}>
                    <ContentEntriesList />
                </LeftPanel>
                <RightPanel span={8}>
                    <ContentEntryProvider>
                        <ContentEntry />
                    </ContentEntryProvider>
                </RightPanel>
            </SplitView>
        </ContentEntriesProvider>
    );
};

export default ContentEntries;
