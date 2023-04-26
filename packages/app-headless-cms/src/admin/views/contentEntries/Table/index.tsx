import React from "react";
import { LeftPanel, RightPanel, SplitView } from "@webiny/app-admin/components/SplitView";
import { i18n } from "@webiny/app/i18n";
import { Sidebar } from "./Sidebar";
import { Main } from "./Main";
import { useContentEntriesViewNavigation } from "./hooks/useContentEntriesViewNavigation";
import { Provider as ContentEntryProvider } from "~/admin/views/contentEntries/ContentEntry/ContentEntryContext";

const t = i18n.ns("app-headless-cms/admin/content-entries/table");

const Index: React.VFC = () => {
    const { currentFolderId } = useContentEntriesViewNavigation();

    const defaultFolderName = t`All entries`;

    return (
        <SplitView>
            <LeftPanel span={2}>
                <Sidebar folderId={currentFolderId} defaultFolderName={defaultFolderName} />
            </LeftPanel>
            <RightPanel span={10}>
                <ContentEntryProvider>
                    <Main folderId={currentFolderId} defaultFolderName={defaultFolderName} />
                </ContentEntryProvider>
            </RightPanel>
        </SplitView>
    );
};

export default Index;
