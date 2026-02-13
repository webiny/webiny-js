import React, { useCallback } from "react";
import { LeftPanel, RightPanel, SplitView, useRoute, useRouter } from "@webiny/app-admin";
import { AcoProvider, useNavigateFolder } from "@webiny/app-aco";
import { Sidebar } from "./Sidebar.js";
import { Main } from "./Main.js";
import { ContentEntryProvider } from "~/admin/views/contentEntries/ContentEntry/ContentEntryContext.js";
import { useApolloClient, useModel } from "~/admin/hooks/index.js";
import { ContentEntriesListProvider } from "~/admin/views/contentEntries/hooks/index.js";
import { createLastVisitedFolderKey } from "~/admin/constants.js";
import { Routes } from "~/routes.js";
import { useContentEntryListConfig } from "~/admin/config/contentEntries/index.js";

const View = () => {
    const { currentFolderId } = useNavigateFolder();
    const { model } = useModel();

    return (
        <SplitView namespace={`cms/entry/${model.modelId}/list`}>
            <LeftPanel span={2}>
                <Sidebar />
            </LeftPanel>
            <RightPanel span={10}>
                <ContentEntryProvider currentFolderId={currentFolderId}>
                    <Main folderId={currentFolderId} />
                </ContentEntryProvider>
            </RightPanel>
        </SplitView>
    );
};

export const Table = () => {
    const { model } = useModel();
    const client = useApolloClient();
    const { goToRoute } = useRouter();
    const { browser } = useContentEntryListConfig();
    const { route } = useRoute(Routes.ContentEntries.List);

    const navigateToFolder = useCallback(
        (folderId: string) => {
            goToRoute(Routes.ContentEntries.List, {
                modelId: model.modelId,
                folderId
            });
        },
        [model.modelId, route.params]
    );

    const createStorageKey = useCallback(() => {
        return createLastVisitedFolderKey(model.modelId);
    }, [model.modelId]);

    return (
        <AcoProvider
            id={`cms:${model.modelId}`}
            folderId={route.params.folderId}
            folderIdPath={"wbyAco_location.folderId"}
            client={client}
            model={model}
            navigateToFolder={navigateToFolder}
            createNavigateFolderStorageKey={createStorageKey}
            columns={browser.table.columns ?? []}
        >
            <ContentEntriesListProvider>
                <View />
            </ContentEntriesListProvider>
        </AcoProvider>
    );
};
