import React, { useCallback } from "react";
import { observer } from "mobx-react-lite";
import { useCreateDialog, useGetFolderLevelPermission } from "@webiny/app-aco";
import { ListView } from "@webiny/app-admin";
import { ReactComponent as HomeIcon } from "@webiny/icons/home.svg";
import { ReactComponent as FolderIcon } from "@webiny/icons/folder.svg";
import { ReactComponent as SearchIcon } from "@webiny/icons/search.svg";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { FolderTree } from "@webiny/app-aco/presentation/folderTree/FolderTree.js";
import { EmptyView } from "@webiny/app-admin";
import { Button, Tooltip } from "@webiny/admin-ui";
import { useRedirectListPresenter } from "./RedirectListPresenterProvider.js";
import { useRedirectListConfig } from "../configs/RedirectListConfig.js";
import { ButtonsCreate } from "./ButtonsCreate.js";
import { Table } from "./Table/Table.js";
import { CreateRedirectDialog } from "./CreateRedirectDialog.js";
import { EditRedirectDialog } from "./EditRedirectDialog.js";

interface RedirectEmptyProps {
    isSearch: boolean;
    canCreateContent: boolean;
    canCreateFolder: boolean;
    onCreateDocument: (event: React.SyntheticEvent) => void;
    onCreateFolder: (event: React.SyntheticEvent) => void;
}

const RedirectEmpty = ({
    isSearch,
    canCreateContent,
    canCreateFolder,
    onCreateDocument,
    onCreateFolder
}: RedirectEmptyProps) => {
    if (isSearch) {
        return <EmptyView icon={<SearchIcon />} title={"No results found."} action={null} />;
    }

    let createDocumentButton = (
        <Button
            variant={"primary"}
            onClick={onCreateDocument}
            disabled={!canCreateContent}
            text={"New redirect"}
            icon={<AddIcon />}
        />
    );

    if (!canCreateContent) {
        createDocumentButton = (
            <Tooltip
                trigger={createDocumentButton}
                content={`Cannot create redirect because you're not an owner.`}
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
                content={`Cannot create folder because you're not an owner.`}
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
    const { vm, actions } = useRedirectListPresenter();
    const { browser } = useRedirectListConfig();
    const { showDialog: showCreateFolderDialog } = useCreateDialog();

    const folderId = vm.folders.currentFolderId ?? "root";
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
        actions.showCreateDialog(folderId);
    }, [folderId, actions]);

    const isSearch = !vm.showFolders;
    const hasFolders = vm.showFolders && vm.folders.childFolders.length > 0;

    return (
        <>
            <ListView
                list={vm.list}
                actions={actions}
                namespace="wb/redirect/list"
                showingFilters={vm.showingFilters}
                onToggleFilters={() => {
                    vm.showingFilters ? actions.hideFilters() : actions.showFilters();
                }}
                sidebar={
                    <ListView.Sidebar title="Redirects">
                        <ListView.Sidebar.Section grow>
                            <FolderTree
                                vm={vm.folders}
                                actions={actions.folders}
                                folderActions={browser.folder.actions}
                                enableActions={true}
                                enableCreate={true}
                            />
                        </ListView.Sidebar.Section>
                    </ListView.Sidebar>
                }
                header={
                    <ListView.Header
                        title={{
                            icon: isRoot ? <HomeIcon /> : <FolderIcon />,
                            text: isRoot ? "Home" : vm.folders.currentFolderTitle
                        }}
                        search
                        filtersToggle
                        actions={
                            <ButtonsCreate
                                canCreateFolder={canCreateFolder(folderId)}
                                canCreateContent={canCreateContent(folderId)}
                                onCreateFolder={onCreateFolder}
                                onCreateDocument={onCreateDocument}
                            />
                        }
                    />
                }
                bulkActions={
                    <ListView.BulkActions itemLabel="redirect" actions={browser.bulkActions} />
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
                                <RedirectEmpty
                                    isSearch={isSearch}
                                    canCreateContent={canCreateContent(folderId)}
                                    canCreateFolder={canCreateFolder(folderId)}
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
                bottomBar={<ListView.BottomBar meta={{ itemLabel: "redirect" }} status />}
            />
            <CreateRedirectDialog />
            <EditRedirectDialog />
        </>
    );
});
