import React, { useMemo } from "react";
import { DiContainerProvider, useContainer } from "@webiny/app";
import { useRoute, useRouter, AdminLayout, DialogsProvider } from "@webiny/app-admin";
import { NavigateFolderProvider } from "@webiny/app-aco";
import { FoldersProvider } from "@webiny/app-aco/contexts/folders.js";
import { PagesList } from "./PagesList/PagesList.js";
import { WB_PAGE_APP } from "~/constants.js";
import { PageListWithConfig } from "./configs/index.js";
import { WB_PAGE_LATEST_VISITED_FOLDER } from "~/constants.js";
import { Routes } from "~/routes.js";
import { WbTrashBinFeature } from "~/features/pages/trashBin/feature.js";

const createStorageKey = () => {
    return WB_PAGE_LATEST_VISITED_FOLDER;
};

export const PageList = () => {
    const router = useRouter();
    const container = useContainer();
    const { route } = useRoute(Routes.Pages.List);

    const scopedContainer = useMemo(() => {
        const child = container.createChildContainer();
        WbTrashBinFeature.register(child);
        return child;
    }, []);

    const navigateToFolder = (folderId: string) => {
        router.goToRoute(Routes.Pages.List, { folderId });
    };

    return (
        <DiContainerProvider container={scopedContainer}>
            <AdminLayout title={"Pages - Website Builder"}>
                <PageListWithConfig>
                    <FoldersProvider type={WB_PAGE_APP}>
                        <NavigateFolderProvider
                            folderId={route.params.folderId}
                            createStorageKey={createStorageKey}
                            navigateToFolder={navigateToFolder}
                        >
                            <DialogsProvider>
                                <PagesList />
                            </DialogsProvider>
                        </NavigateFolderProvider>
                    </FoldersProvider>
                </PageListWithConfig>
            </AdminLayout>
        </DiContainerProvider>
    );
};
