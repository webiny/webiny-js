import React from "react";
import { LeftPanel, RightPanel, SplitView } from "@webiny/app-admin/components/SplitView";
import ContentEntriesList from "~/admin/views/contentEntries/ContentEntriesList";
import { ContentEntry } from "~/admin/views/contentEntries/ContentEntry";
import { Provider as ContentEntryProvider } from "./ContentEntry/ContentEntryContext";

const ContentEntries: React.FC = () => {
    return (
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
    );
};

export default ContentEntries;
