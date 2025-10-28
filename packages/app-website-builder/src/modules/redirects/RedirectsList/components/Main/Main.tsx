import React, { useCallback } from "react";
import debounce from "lodash/debounce.js";
import { useCreateDialog, useGetFolderLevelPermission } from "@webiny/app-aco";
import { Scrollbar } from "@webiny/admin-ui";
import { useDocumentList } from "~/modules/redirects/RedirectsList/useDocumentList.js";
import { Header } from "~/modules/redirects/RedirectsList/components/Header/index.js";
import { BottomInfoBar } from "~/modules/redirects/RedirectsList/components/BottomInfoBar/index.js";
import { Table } from "~/modules/redirects/RedirectsList/components/Table/index.js";
import { Empty } from "~/modules/redirects/RedirectsList/components/Empty/index.js";
import { useLoadMoreRedirects } from "~/features/redirects/index.js";
import { BulkActions } from "../BulkActions/index.js";
import { Filters } from "~/modules/redirects/RedirectsList/components/Filters/index.js";
import { useCreateRedirectDialog } from "~/modules/redirects/RedirectsList/index.js";

const Main = () => {
    const { vm } = useDocumentList();
    const { loadMoreRedirects } = useLoadMoreRedirects();
    const { showDialog: showCreateFolderDialog } = useCreateDialog();

    const { showCreateRedirectDialog } = useCreateRedirectDialog(vm.folderId);
    const { getFolderLevelPermission: canManageContent } =
        useGetFolderLevelPermission("canManageContent");

    const { getFolderLevelPermission: canManageStructure } =
        useGetFolderLevelPermission("canManageStructure");

    const canCreateContent = useCallback(
        (folderId: string) => {
            return canManageContent(folderId);
        },
        [canManageContent]
    );

    const canCreateFolder = useCallback(
        (folderId: string) => {
            return canManageStructure(folderId);
        },
        [canManageStructure]
    );

    const onCreateFolder = useCallback(() => {
        showCreateFolderDialog({ currentParentId: vm.folderId });
    }, [vm.folderId]);

    const onTableScroll = debounce(async ({ scrollFrame }) => {
        if (scrollFrame.top > 0.8) {
            await loadMoreRedirects();
        }
    }, 200);

    return (
        <div className={"h-full relative overflow-hidden"}>
            <Header
                title={vm.title}
                canCreateFolder={canCreateFolder(vm.folderId)}
                canCreateContent={canCreateContent(vm.folderId)}
                onCreateFolder={onCreateFolder}
                onCreateDocument={showCreateRedirectDialog}
                isRoot={vm.isRoot}
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
                    {vm.isEmpty ? (
                        <Empty
                            isSearch={vm.isSearch}
                            canCreateFolder={canCreateFolder(vm.folderId)}
                            canCreateContent={canCreateContent(vm.folderId)}
                            onCreateFolder={onCreateFolder}
                            onCreateDocument={showCreateRedirectDialog}
                        />
                    ) : (
                        <Table />
                    )}
                </Scrollbar>
                <BottomInfoBar />
            </div>
        </div>
    );
};

export { Main };
