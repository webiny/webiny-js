import React, { useMemo, useEffect } from "react";
import { useRoute, AdminLayout, DialogsProvider } from "@webiny/app-admin";
import { DiContainerProvider, useContainer, useFeature } from "@webiny/app";
import { RouteParamsSync } from "@webiny/app/presentation/router/components/RouteParamsSync.js";
import { observer } from "mobx-react-lite";
import { FoldersFeature } from "@webiny/app-aco/features/folders/feature.js";
import { FolderTreePresenterFeature } from "@webiny/app-aco/presentation/folderTree/feature.js";
import { ListPresenterFeature } from "@webiny/app-admin/presentation/listPresenter/feature.js";
import { SharedPageInfrastructureFeature } from "~/features/pages/shared/feature.js";
import { ListPagesFeature } from "~/features/pages/listPages/feature.js";
import { DeletePageFeature } from "~/features/pages/deletePage/feature.js";
import { PublishPageFeature } from "~/features/pages/publishPage/feature.js";
import { UnpublishPageFeature } from "~/features/pages/unpublishPage/feature.js";
import { MovePageFeature } from "~/features/pages/movePage/feature.js";
import { DuplicatePageFeature } from "~/features/pages/duplicatePage/feature.js";
import { WbTrashBinFeature } from "~/features/pages/trashBin/feature.js";
import { PageListPresenterFeature } from "~/presentation/pages/PageList/feature.js";
import { PageListPresenterProvider } from "../PageListPresenterProvider.js";
import { WB_PAGE_APP } from "~/constants.js";
import { Routes } from "~/routes.js";
import { PageListWithConfig } from "../configs/index.js";
import { DocumentList } from "./DocumentList.js";

const PagesListInner = observer(() => {
    const { presenter } = useFeature(PageListPresenterFeature);
    const { route } = useRoute(Routes.Pages.List);

    useEffect(() => {
        presenter.init({
            initialFolderId: route.params.folderId || "root"
        });
        return () => presenter.dispose();
    }, [presenter]);

    return (
        <DialogsProvider>
            <PageListWithConfig>
                <PageListPresenterProvider presenter={presenter}>
                    <DocumentList />
                    <RouteParamsSync
                    route={Routes.Pages.List}
                    fields={fields => [
                        fields.create<string>({
                            param: "folderId",
                            read: () => presenter.folders.vm.currentFolderId ?? undefined,
                            write: value => {
                                presenter.folders.selectFolder(value ?? null);
                            }
                        }),
                        fields.create<string>({
                            param: "search",
                            read: () => presenter.list.vm.search || undefined,
                            write: value => {
                                if (value) {
                                    presenter.list.actions.search.set(value);
                                } else {
                                    presenter.list.actions.search.clear();
                                }
                            }
                        })
                    ]}
                />
                </PageListPresenterProvider>
            </PageListWithConfig>
        </DialogsProvider>
    );
});

export const PagesList = () => {
    const container = useContainer();

    const scopedContainer = useMemo(() => {
        const child = container.createChildContainer();

        SharedPageInfrastructureFeature.register(child);
        FoldersFeature.register(child, { type: WB_PAGE_APP });
        FolderTreePresenterFeature.register(child);
        ListPresenterFeature.register(child);
        ListPagesFeature.register(child);
        DeletePageFeature.register(child);
        PublishPageFeature.register(child);
        UnpublishPageFeature.register(child);
        MovePageFeature.register(child);
        DuplicatePageFeature.register(child);
        WbTrashBinFeature.register(child);
        PageListPresenterFeature.register(child);

        return child;
    }, []);

    return (
        <AdminLayout title={"Pages - Website Builder"}>
            <DiContainerProvider container={scopedContainer}>
                <PagesListInner />
            </DiContainerProvider>
        </AdminLayout>
    );
};
