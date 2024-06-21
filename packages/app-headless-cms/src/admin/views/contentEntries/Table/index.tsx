import React, { useCallback, useMemo } from "react";
import {
    generateAutoSaveId,
    LeftPanel,
    RightPanel,
    SplitView
} from "@webiny/app-admin/components/SplitView";
import { Sidebar } from "./Sidebar";
import { Main } from "./Main";
import { ContentEntryProvider } from "~/admin/views/contentEntries/ContentEntry/ContentEntryContext";
import { AcoProvider, useNavigateFolder } from "@webiny/app-aco";
import { useI18N } from "@webiny/app-i18n";
import { useTenancy } from "@webiny/app-tenancy";
import { useApolloClient, useModel } from "~/admin/hooks";
import { ContentEntriesListProvider } from "~/admin/views/contentEntries/hooks";
import { CMS_ENTRY_LIST_LINK, LOCAL_STORAGE_LATEST_VISITED_FOLDER } from "~/admin/constants";

const View = () => {
    const { currentFolderId } = useNavigateFolder();
    const { model } = useModel();
    const { getCurrentLocale } = useI18N();
    const { tenant } = useTenancy();

    const autoSaveId = useMemo(() => {
        const localeCode = getCurrentLocale("content");
        const applicationId = `cms:${model.modelId}`;
        return generateAutoSaveId(tenant, localeCode, applicationId);
    }, [model, getCurrentLocale, tenant]);

    return (
        <SplitView autoSaveId={autoSaveId}>
            <LeftPanel span={2}>
                <Sidebar folderId={currentFolderId} />
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

    const createNavigateFolderListLink = useCallback(() => {
        return `${CMS_ENTRY_LIST_LINK}/${model.modelId}`;
    }, [model.modelId]);
    const createNavigateFolderStorageKey = useCallback(() => {
        return `${LOCAL_STORAGE_LATEST_VISITED_FOLDER}_${model.modelId}`;
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
            <ContentEntriesListProvider>
                <View />
            </ContentEntriesListProvider>
        </AcoProvider>
    );
};
