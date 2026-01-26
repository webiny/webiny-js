import React, { useCallback } from "react";
import { LeftPanel, RightPanel, SplitView, useRoute, useRouter } from "@webiny/app-admin";
import { AcoProvider, useNavigateFolder } from "@webiny/app-aco";
import { useTenantContext } from "@webiny/app-admin";
import { Sidebar } from "./Sidebar.js";
import { Main } from "./Main.js";
import { ContentEntryProvider } from "~/admin/views/contentEntries/ContentEntry/ContentEntryContext.js";
import { useApolloClient, useModel } from "~/admin/hooks/index.js";
import { ContentEntriesListProvider } from "~/admin/views/contentEntries/hooks/index.js";
import { LOCAL_STORAGE_LATEST_VISITED_FOLDER } from "~/admin/constants.js";
import { Routes } from "~/routes.js";
import { useContentEntryListConfig } from "~/admin/config/contentEntries/index.js";

/**
 * Generates a `layoutId` to be used with the `<SplitView />` component.
 * The `layoutId` is essential for saving user preferences into localStorage.
 * The generation of the `layoutId` takes into account the current `tenantId` and the provided `applicationId`.
 *
 *  TODO: export the useLayoutId from a generic use package, such as app-admin. At the moment is not possible because of circular dependency issues.
 */
const useLayoutId = (applicationId: string) => {
    const { tenant } = useTenantContext();

    if (!tenant) {
        console.warn("Missing tenant while creating layoutId");
        return null;
    }

    return `T#${tenant}#A#${applicationId}`;
};

const View = () => {
    const { currentFolderId } = useNavigateFolder();
    const { model } = useModel();
    const layoutId = useLayoutId(`cms:${model.modelId}`);

    return (
        <SplitView layoutId={layoutId}>
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

    const createNavigateFolderStorageKey = useCallback(() => {
        return `${LOCAL_STORAGE_LATEST_VISITED_FOLDER}_${model.modelId}`;
    }, [model.modelId]);

    return (
        <AcoProvider
            id={`cms:${model.modelId}`}
            folderId={route.params.folderId}
            folderIdPath={"wbyAco_location.folderId"}
            client={client}
            model={model}
            navigateToFolder={navigateToFolder}
            createNavigateFolderStorageKey={createNavigateFolderStorageKey}
            columns={browser.table.columns ?? []}
        >
            <ContentEntriesListProvider>
                <View />
            </ContentEntriesListProvider>
        </AcoProvider>
    );
};
