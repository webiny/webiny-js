import React, { useCallback, useMemo } from "react";
import debounce from "lodash/debounce";
import { useCreateDialog, useGetFolderLevelPermission } from "@webiny/app-aco";
import { Scrollbar } from "@webiny/admin-ui";
import { useDocumentList } from "~/DocumentList/useDocumentList.js";
import { Header } from "~/DocumentList/components/Header/index.js";
import { BottomInfoBar } from "~/DocumentList/components/BottomInfoBar/index.js";
import { Table } from "~/DocumentList/components/Table/index.js";
import { useListMorePages } from "~/features/pages/index.js";
import { Empty } from "~/DocumentList/components/Empty/index.js";

const Main = () => {
    const { vm } = useDocumentList();
    const { listMorePages } = useListMorePages();
    const { showDialog: showCreateFolderDialog } = useCreateDialog();
    const { getFolderLevelPermission: canManageContent } =
        useGetFolderLevelPermission("canManageContent");
    const { getFolderLevelPermission: canManageStructure } =
        useGetFolderLevelPermission("canManageStructure");

    const canCreateFolder = useMemo(() => {
        return canManageStructure(vm.folderId);
    }, [canManageContent, vm.folderId]);

    const canCreateContent = useMemo(() => {
        return canManageContent(vm.folderId);
    }, [canManageContent, vm.folderId]);

    const onCreateFolder = useCallback(() => {
        showCreateFolderDialog({ currentParentId: vm.folderId });
    }, [vm.folderId]);

    const onTableScroll = debounce(async ({ scrollFrame }) => {
        if (scrollFrame.top > 0.8) {
            await listMorePages();
        }
    }, 200);

    return (
        <div className={"wby-h-full wby-relative wby-overflow-hidden"}>
            <Header
                title={vm.title}
                canCreateFolder={canCreateFolder}
                canCreateContent={canCreateContent}
                onCreateFolder={onCreateFolder}
                onCreateDocument={() => alert("Create document")}
                isRoot={vm.isRoot}
            />
            <div
                style={{ top: "105px" }}
                className={
                    "wby-w-full wby-overflow-hidden wby-absolute wby-top-0 wby-bottom-0 wby-left-0"
                }
            >
                <>
                    <Scrollbar
                        data-testid="default-data-list"
                        onScrollFrame={scrollFrame => onTableScroll({ scrollFrame })}
                    >
                        {vm.isEmpty ? (
                            <Empty
                                isSearch={vm.isSearch}
                                canCreateFolder={canCreateFolder}
                                canCreateContent={canCreateContent}
                                onCreateFolder={onCreateFolder}
                                onCreateDocument={() => alert("Create document")}
                            />
                        ) : (
                            <Table />
                        )}
                    </Scrollbar>
                    <BottomInfoBar />
                </>
            </div>
        </div>
    );
};

export { Main };
