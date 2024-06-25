import React, { useCallback } from "react";
import { LeftPanel, RightPanel, SplitView } from "@webiny/app-admin/components/SplitView";
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

/**
 * Generates a `layoutId` to be used with the `<SplitView />` component.
 * The `layoutId` is essential for saving user preferences into localStorage.
 * The generation of the `layoutId` takes into account the current `tenantId`, `localeCode`, and the provided `applicationId`.
 *
 *  TODO: export the useLayoutId from a generic use package, such as app-admin. At the moment is not possible because of circular dependency issues.
 */
const useLayoutId = (applicationId: string) => {
    const { tenant } = useTenancy();
    const { getCurrentLocale } = useI18N();
    const localeCode = getCurrentLocale("content");

    if (!tenant || !localeCode) {
        console.warn("Missing tenant or localeCode while creating layoutId");
        return null;
    }

    return `T#${tenant}#L#${localeCode}#A#${applicationId}`;
};

const View = () => {
    const { currentFolderId } = useNavigateFolder();
    const layoutId = useLayoutId("pb:page");

    return (
        <SplitView layoutId={layoutId}>
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
