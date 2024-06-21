import React, { useCallback, useMemo } from "react";
import {
    generateAutoSaveId,
    LeftPanel,
    RightPanel,
    SplitView
} from "@webiny/app-admin/components/SplitView";
import { useI18N } from "@webiny/app-i18n";
import { useTenancy } from "@webiny/app-tenancy";
import { AcoWithConfig } from "@webiny/app-aco";
import { Sidebar } from "./Sidebar";
import { Main } from "./Main";
import {
    LOCAL_STORAGE_LATEST_VISITED_FOLDER,
    PAGE_BUILDER_LIST_LINK,
    PB_APP_TYPE
} from "~/admin/constants";
import { AcoProvider, useNavigateFolder } from "@webiny/app-aco";
import { useApolloClient } from "@apollo/react-hooks";
import { usePagesPermissions } from "~/hooks/permissions";
import { PagesListProvider } from "~/admin/views/Pages/hooks/usePagesList";
import { PageListWithConfig } from "~/admin/config/pages";

const View = () => {
    const { currentFolderId } = useNavigateFolder();
    const { getCurrentLocale } = useI18N();
    const { tenant } = useTenancy();

    const autoSaveId = useMemo(() => {
        const localeCode = getCurrentLocale("content");
        const applicationId = "pb:page";
        return generateAutoSaveId(tenant, localeCode, applicationId);
    }, [getCurrentLocale, tenant]);

    return (
        <SplitView autoSaveId={autoSaveId}>
            <LeftPanel span={2}>
                <Sidebar folderId={currentFolderId} />
            </LeftPanel>
            <RightPanel span={10}>
                <Main folderId={currentFolderId} />
            </RightPanel>
        </SplitView>
    );
};

const Index = () => {
    const client = useApolloClient();
    const { canAccessOnlyOwn } = usePagesPermissions();

    const createNavigateFolderListLink = useCallback(() => {
        return PAGE_BUILDER_LIST_LINK;
    }, []);
    const createNavigateFolderStorageKey = useCallback(() => {
        return LOCAL_STORAGE_LATEST_VISITED_FOLDER;
    }, []);

    return (
        <AcoProvider
            id={PB_APP_TYPE}
            client={client}
            createNavigateFolderListLink={createNavigateFolderListLink}
            createNavigateFolderStorageKey={createNavigateFolderStorageKey}
            own={canAccessOnlyOwn()}
        >
            <PageListWithConfig>
                <AcoWithConfig>
                    <PagesListProvider>
                        <View />
                    </PagesListProvider>
                </AcoWithConfig>
            </PageListWithConfig>
        </AcoProvider>
    );
};

export default Index;
