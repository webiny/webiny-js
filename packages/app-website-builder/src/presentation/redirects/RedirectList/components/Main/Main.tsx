import React, { useCallback } from "react";
import { observer } from "mobx-react-lite";
import debounce from "lodash/debounce.js";
import { useCreateDialog, useGetFolderLevelPermission } from "@webiny/app-aco";
import { Scrollbar } from "@webiny/admin-ui";
import { BulkActions } from "../BulkActions/index.js";
import { useRedirectListPresenter } from "../RedirectListPresenterProvider.js";
import { Filters } from "../Filters/Filters.js";
import { Empty } from "../Empty/Empty.js";
import { Header } from "../Header/Header.js";
import { Table } from "../Table/Table.js";
import { BottomInfoBar } from "../BottomInfoBar/BottomInfoBar.js";

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
                title={isRoot ? "Home" : vm.folders.currentFolderTitle}
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
