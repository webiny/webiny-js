import React, { useCallback } from "react";
import debounce from "lodash/debounce.js";
import { useCreateDialog, useGetFolderLevelPermission } from "@webiny/app-aco";
import { Scrollbar } from "@webiny/admin-ui";
import { observer } from "mobx-react-lite";
import { useRedirectListPresenter } from "~/presentation/redirects/RedirectList/RedirectListPresenterProvider.js";
import { Header } from "~/modules/redirects/RedirectsList/components/Header/index.js";
import { BottomInfoBar } from "~/modules/redirects/RedirectsList/components/BottomInfoBar/index.js";
import { Table } from "~/modules/redirects/RedirectsList/components/Table/index.js";
import { Empty } from "~/modules/redirects/RedirectsList/components/Empty/index.js";
import { BulkActions } from "../BulkActions/index.js";
import { Filters } from "~/modules/redirects/RedirectsList/components/Filters/index.js";

const Main = observer(() => {
    const { vm, actions } = useRedirectListPresenter();
    const { showDialog: showCreateFolderDialog } = useCreateDialog();

    const folderId = vm.folders.currentFolderId ?? "root";
    const isRoot = folderId === "root";

    const { getFolderLevelPermission: canManageContent } =
        useGetFolderLevelPermission("canManageContent");

    const { getFolderLevelPermission: canManageStructure } =
        useGetFolderLevelPermission("canManageStructure");

    const canCreateContent = useCallback(
        (id: string) => {
            return canManageContent(id);
        },
        [canManageContent]
    );

    const canCreateFolder = useCallback(
        (id: string) => {
            return canManageStructure(id);
        },
        [canManageStructure]
    );

    const onCreateFolder = useCallback(() => {
        showCreateFolderDialog({ currentParentId: folderId });
    }, [folderId]);

    const onCreateDocument = useCallback(() => {
        actions.showCreateDialog(folderId);
    }, [folderId, actions]);

    const onTableScroll = debounce(async ({ scrollFrame }) => {
        if (scrollFrame.top > 0.8) {
            await actions.loadMore();
        }
    }, 200);

    const isEmpty = vm.list.empty;
    const isSearch = !vm.showFolders;

    return (
        <div className={"h-full relative overflow-hidden"}>
            <Header
                title={vm.folders.currentFolderId ? undefined : undefined}
                canCreateFolder={canCreateFolder(folderId)}
                canCreateContent={canCreateContent(folderId)}
                onCreateFolder={onCreateFolder}
                onCreateDocument={onCreateDocument}
                isRoot={isRoot}
            />
            <div
                style={{ top: "105px" }}
                className={"w-full overflow-hidden absolute top-0 bottom-0 left-0"}
            >
                <BulkActions />
                <Filters />
                <Scrollbar
                    data-testid="default-data-list"
                    onScrollFrame={scrollFrame => onTableScroll({ scrollFrame })}
                >
                    {isEmpty ? (
                        <Empty
                            isSearch={isSearch}
                            canCreateFolder={canCreateFolder(folderId)}
                            canCreateContent={canCreateContent(folderId)}
                            onCreateFolder={onCreateFolder}
                            onCreateDocument={onCreateDocument}
                        />
                    ) : (
                        <Table />
                    )}
                </Scrollbar>
                <BottomInfoBar />
            </div>
        </div>
    );
});

export { Main };
