import React, { useCallback } from "react";
import { LeftPanel, RightPanel, SplitView } from "@webiny/app-admin/components/SplitView";
import { i18n } from "@webiny/app/i18n";
import { Sidebar } from "./Sidebar";
import { Main } from "./Main";
import { ContentEntryProvider } from "~/admin/views/contentEntries/ContentEntry/ContentEntryContext";
import { AcoProvider, useNavigateFolder } from "@webiny/app-aco";
import { useApolloClient, useModel } from "~/admin/hooks";
import { CMS_ENTRY_LIST_LINK, LOCAL_STORAGE_LATEST_VISITED_FOLDER } from "~/admin/constants";

const t = i18n.ns("app-headless-cms/admin/content-entries/table");

const View: React.VFC = () => {
    const { currentFolderId } = useNavigateFolder();

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

export const Table: React.VFC = () => {
    const { model } = useModel();
    const client = useApolloClient();

    const createNavigateFolderListLink = useCallback(() => {
        return `${CMS_ENTRY_LIST_LINK}/${model.modelId}`;
    }, [model.modelId]);
    const createNavigateFolderStorageKey = useCallback(() => {
        return LOCAL_STORAGE_LATEST_VISITED_FOLDER;
    }, [model.modelId]);

    return (
        <AcoProvider
            id={`cms:${model.modelId}`}
            client={client}
            model={model}
            createNavigateFolderListLink={createNavigateFolderListLink}
            createNavigateFolderStorageKey={createNavigateFolderStorageKey}
        >
            <View />
        </AcoProvider>
    );
};
