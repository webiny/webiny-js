import React, { useMemo, useEffect } from "react";
import { useRoute, useRouter, AdminLayout, DialogsProvider } from "@webiny/app-admin";
import { DiContainerProvider, useContainer, useFeature } from "@webiny/app";
import { observer } from "mobx-react-lite";
import { FoldersFeature } from "@webiny/app-aco/features/folders/feature.js";
import { FolderTreePresenterFeature } from "@webiny/app-aco/presentation/folderTree/feature.js";
import { ListPresenterFeature } from "@webiny/app-admin/presentation/listPresenter/feature.js";
import { SharedRedirectCacheFeature } from "~/features/redirects/shared/feature.js";
import { ListRedirectsFeature } from "~/features/redirects/listRedirects/feature.js";
import { GetRedirectFeature } from "~/features/redirects/getRedirect/feature.js";
import { CreateRedirectFeature } from "~/features/redirects/createRedirect/feature.js";
import { DeleteRedirectFeature } from "~/features/redirects/deleteRedirect/feature.js";
import { UpdateRedirectFeature } from "~/features/redirects/updateRedirect/feature.js";
import { MoveRedirectFeature } from "~/features/redirects/moveRedirect/feature.js";
import { CreateRedirectPresenterFeature } from "~/presentation/redirects/CreateRedirect/feature.js";
import { EditRedirectPresenterFeature } from "~/presentation/redirects/EditRedirect/feature.js";
import { RedirectListPresenterFeature } from "~/presentation/redirects/RedirectList/feature.js";
import {
    RedirectListPresenterProvider
} from "~/presentation/redirects/RedirectList/RedirectListPresenterProvider.js";
import { DocumentList } from "./RedirectsList/DocumentList.js";
import { WB_REDIRECTS_APP } from "~/constants.js";
import { RedirectListWithConfig } from "~/modules/redirects/configs/index.js";
import { Routes } from "~/routes.js";

const RedirectsListInner = observer(() => {
    const { presenter } = useFeature(RedirectListPresenterFeature);
    const { route } = useRoute(Routes.Redirects.List);

    useEffect(() => {
        presenter.init({
            initialFolderId: route.params.folderId || "root"
        });
        return () => presenter.dispose();
    }, [presenter]);

    return (
        <DialogsProvider>
            <RedirectListWithConfig>
                <RedirectListPresenterProvider presenter={presenter}>
                    <DocumentList />
                </RedirectListPresenterProvider>
            </RedirectListWithConfig>
        </DialogsProvider>
    );
});

export const RedirectsList = () => {
    const container = useContainer();

    const scopedContainer = useMemo(() => {
        const child = container.createChildContainer();

        SharedRedirectCacheFeature.register(child);
        FoldersFeature.register(child, { type: WB_REDIRECTS_APP });
        FolderTreePresenterFeature.register(child);
        ListPresenterFeature.register(child);
        ListRedirectsFeature.register(child);
        GetRedirectFeature.register(child);
        CreateRedirectFeature.register(child);
        DeleteRedirectFeature.register(child);
        UpdateRedirectFeature.register(child);
        MoveRedirectFeature.register(child);
        CreateRedirectPresenterFeature.register(child);
        EditRedirectPresenterFeature.register(child);
        RedirectListPresenterFeature.register(child);

        return child;
    }, []);

    return (
        <AdminLayout title={"Redirects - Website Builder"}>
            <DiContainerProvider container={scopedContainer}>
                <RedirectsListInner />
            </DiContainerProvider>
        </AdminLayout>
    );
};
