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

    const rootFolderLabel = t`All entries`;
    return (
        <SplitView>
            <LeftPanel span={2}>
                <Sidebar folderId={currentFolderId} rootFolderLabel={rootFolderLabel} />
            </LeftPanel>
            <RightPanel span={10}>
                <ContentEntryProvider>
                    <Main folderId={currentFolderId} rootFolderLabel={rootFolderLabel} />
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
            folderIdPath={"wbyAco_location.folderId"}
            client={client}
            model={model}
            createNavigateFolderListLink={createNavigateFolderListLink}
            createNavigateFolderStorageKey={createNavigateFolderStorageKey}
        >
            <View />
        </AcoProvider>
    );
};
