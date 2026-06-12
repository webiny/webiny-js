import React, { useCallback } from "react";
import { observer } from "mobx-react-lite";
import { useCreateDialog, useGetFolderLevelPermission } from "@webiny/app-aco";
import { ListView, EmptyView } from "@webiny/app-admin";
import { ReactComponent as HomeIcon } from "@webiny/icons/home.svg";
import { ReactComponent as FolderIcon } from "@webiny/icons/folder.svg";
import { ReactComponent as SearchIcon } from "@webiny/icons/search.svg";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { FolderTree } from "@webiny/app-aco/presentation/folderTree/FolderTree.js";
import { Button, Tooltip } from "@webiny/admin-ui";
import { usePageListPresenter } from "../PageListPresenterProvider.js";
import { usePageListConfig } from "../configs/index.js";
import { useCreatePageDialog } from "~/presentation/pages/CreatePage/CreatePageDialog.js";
import { usePermissions } from "~/presentation/security/usePermissions.js";
import { WbTrashBin } from "~/presentation/pages/TrashBin/WbTrashBin.js";
import { Table } from "./Table/Table.js";

interface PageEmptyProps {
    isSearch: boolean;
    canCreateContent: boolean;
    canCreateFolder: boolean;
    onCreateDocument: (event: React.SyntheticEvent) => void;
    onCreateFolder: (event: React.SyntheticEvent) => void;
}

const PageEmpty = ({
    isSearch,
    canCreateContent,
    canCreateFolder,
    onCreateDocument,
    onCreateFolder
}: PageEmptyProps) => {
    if (isSearch) {
        return <EmptyView icon={<SearchIcon />} title={"No results found."} action={null} />;
    }

    let createDocumentButton = (
        <Button
            variant={"primary"}
            onClick={onCreateDocument}
            disabled={!canCreateContent}
            text={"New page"}
            icon={<AddIcon />}
        />
    );

    if (!canCreateContent) {
        createDocumentButton = (
            <Tooltip
                trigger={createDocumentButton}
                content={"Cannot create page because you're not an owner."}
                side={"bottom"}
            />
        );
    }

    let createFolderButton = (
        <Button
            variant={"secondary"}
            onClick={onCreateFolder}
            disabled={!canCreateFolder}
            text={"New folder"}
            icon={<AddIcon />}
        />
    );

    if (!canCreateFolder) {
        createFolderButton = (
            <Tooltip
                trigger={createFolderButton}
                content={"Cannot create folder because you're not an owner."}
                side={"bottom"}
            />
        );
    }

    return (
        <EmptyView
            title={`Nothing to show here. ${
                canCreateContent
                    ? "Navigate to a different folder or create a..."
                    : "Click on the left side to navigate to a different folder."
            }`}
            action={
                <>
                    {createFolderButton}
                    {createDocumentButton}
                </>
            }
        />
    );
};

export const DocumentList = observer(() => {
    const presenter = usePageListPresenter();
    const { vm, list, folders } = presenter;
    const { browser } = usePageListConfig();
    const { showDialog: showCreateFolderDialog } = useCreateDialog();
    const openCreatePageDialog = useCreatePageDialog();
    const wbPermissions = usePermissions();

    const folderId = folders.vm.currentFolderId ?? "root";
    const isRoot = folderId === "root";

    const { getFolderLevelPermission: canManageContent } =
        useGetFolderLevelPermission("canManageContent");

    const { getFolderLevelPermission: canManageStructure } =
        useGetFolderLevelPermission("canManageStructure");

    const canCreateContent = useCallback((id: string) => canManageContent(id), [canManageContent]);

    const canCreateFolder = useCallback(
        (id: string) => canManageStructure(id),
        [canManageStructure]
    );

    const onCreateFolder = useCallback(() => {
        showCreateFolderDialog({ currentParentId: folderId });
    }, [folderId]);

    const onCreateDocument = useCallback(() => {
        openCreatePageDialog(folderId);
    }, [folderId, openCreatePageDialog]);

    const canCreatePage = wbPermissions.canCreate("page") && canCreateContent(folderId);
    const isSearch = !vm.showFolders;
    const hasFolders = vm.showFolders && folders.vm.childFolders.length > 0;

    return (
        <ListView
            list={list.vm}
            actions={list.actions}
            namespace="wb/page/list"
            showingFilters={list.vm.showingFilters}
            onToggleFilters={() => {
                list.vm.showingFilters
                    ? list.actions.filter.hide()
                    : list.actions.filter.show();
            }}
            sidebar={
                <ListView.Sidebar title="Pages">
                    <ListView.Sidebar.Section grow>
                        <FolderTree
                            vm={folders.vm}
                            actions={folders}
                            folderActions={browser.folder.actions}
                            enableActions={true}
                            enableCreate={true}
                        />
                    </ListView.Sidebar.Section>
                    <ListView.Sidebar.Section>
                        <WbTrashBin />
                    </ListView.Sidebar.Section>
                </ListView.Sidebar>
            }
            header={
                <ListView.Header
                    title={{
                        icon: isRoot ? <HomeIcon /> : <FolderIcon />,
                        text: isRoot ? "Home" : folders.vm.currentFolderTitle
                    }}
                    search
                    filtersToggle
                    actions={
                        <>
                            {canCreatePage && canCreateFolder(folderId) ? (
                                <Button
                                    variant={"secondary"}
                                    onClick={onCreateFolder}
                                    text={"New folder"}
                                    size={"sm"}
                                />
                            ) : null}
                            {canCreatePage ? (
                                <Button
                                    variant={"primary"}
                                    onClick={onCreateDocument}
                                    text={"New page"}
                                    size={"sm"}
                                />
                            ) : null}
                        </>
                    }
                />
            }
            bulkActions={
                <ListView.BulkActions itemLabel="page" actions={browser.bulkActions} />
            }
            filters={
                <ListView.Filters
                    filters={browser.filters}
                    filtersToWhere={browser.filtersToWhere}
                />
            }
            content={
                <ListView.Content
                    empty={
                        hasFolders ? undefined : (
                            <PageEmpty
                                isSearch={isSearch}
                                canCreateContent={canCreatePage}
                                canCreateFolder={canCreatePage && canCreateFolder(folderId)}
                                onCreateDocument={onCreateDocument}
                                onCreateFolder={onCreateFolder}
                            />
                        )
                    }
                    searchEmpty={
                        <EmptyView
                            icon={<SearchIcon />}
                            title={"No results found."}
                            action={null}
                        />
                    }
                >
                    <Table />
                </ListView.Content>
            }
            bottomBar={<ListView.BottomBar meta={{ itemLabel: "page" }} status />}
        />
    );
});
