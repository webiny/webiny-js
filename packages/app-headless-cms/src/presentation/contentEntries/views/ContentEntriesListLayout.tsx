import React, { useCallback } from "react";
import { observer } from "mobx-react-lite";
import { useCreateDialog } from "@webiny/app-aco";
import { ListView, EmptyView } from "@webiny/app-admin";
import { Button } from "@webiny/admin-ui";
import { ReactComponent as HomeIcon } from "@webiny/icons/home.svg";
import { ReactComponent as FolderIcon } from "@webiny/icons/folder.svg";
import { FolderTree } from "@webiny/app-aco/presentation/folderTree/FolderTree.js";
import { useContentEntryListConfig } from "~/admin/config/contentEntries/list/ContentEntryListConfig.js";
import { SidebarFooter } from "~/admin/components/ContentEntries/SidebarFooter/SidebarFooter.js";
import { useContentEntriesPresenter } from "./ContentEntriesPresenterProvider.js";
import { ContentEntryFormView } from "./ContentEntryFormView.js";
import { Table } from "./Table/Table.js";

export const ContentEntriesListLayout = observer(() => {
    const { vm } = useContentEntriesPresenter();

    if (vm.loading || !vm.model) {
        return null;
    }

    if (vm.showingEntry) {
        return <ContentEntryFormView />;
    }

    return <DocumentList />;
});

const DocumentList = observer(() => {
    const { vm, actions } = useContentEntriesPresenter();
    const { browser } = useContentEntryListConfig();
    const { showDialog: showCreateFolderDialog } = useCreateDialog();

    const folderId = vm.folders.currentFolderId ?? "root";
    const isRoot = folderId === "root";
    const isSearch = !vm.showFolders;
    const hasFolders = vm.showFolders && vm.folders.childFolders.length > 0;

    const onCreateFolder = useCallback(() => {
        showCreateFolderDialog({ currentParentId: folderId });
    }, [folderId]);

    const onCreateEntry = useCallback(() => {
        actions.createEntry();
    }, [actions]);

    return (
        <ListView
            list={vm.list}
            actions={actions}
            namespace={`cms/${vm.model!.modelId}/list`}
            showingFilters={vm.showingFilters}
            onToggleFilters={() => {
                vm.showingFilters ? actions.hideFilters() : actions.showFilters();
            }}
            sidebar={
                <ListView.Sidebar title={vm.model!.name}>
                    <ListView.Sidebar.Section grow>
                        <FolderTree
                            vm={vm.folders}
                            actions={actions.folders}
                            folderActions={browser.folder.actions}
                            enableActions={true}
                            enableCreate={true}
                        />
                    </ListView.Sidebar.Section>
                    <ListView.Sidebar.Section scrollable={false}>
                        <SidebarFooter />
                    </ListView.Sidebar.Section>
                </ListView.Sidebar>
            }
            header={
                <ListView.Header
                    title={{
                        icon: isRoot ? <HomeIcon /> : <FolderIcon />,
                        text: isRoot ? vm.model!.name : vm.folders.currentFolderTitle
                    }}
                    search
                    filtersToggle
                    actions={
                        <>
                            <Button
                                variant={"secondary"}
                                onClick={onCreateFolder}
                                text={"New Folder"}
                            />
                            <Button
                                variant={"primary"}
                                onClick={onCreateEntry}
                                text={"New Entry"}
                            />
                        </>
                    }
                />
            }
            bulkActions={
                <ListView.BulkActions itemLabel="entry" actions={browser.bulkActions} />
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
                            <EmptyView
                                title={
                                    isSearch
                                        ? "No results found."
                                        : "No entries yet. Create your first entry."
                                }
                                action={
                                    isSearch ? null : (
                                        <Button
                                            variant={"primary"}
                                            onClick={onCreateEntry}
                                            text={"New Entry"}
                                        />
                                    )
                                }
                            />
                        )
                    }
                    searchEmpty={<EmptyView title={"No results found."} action={null} />}
                >
                    <Table />
                </ListView.Content>
            }
            bottomBar={<ListView.BottomBar meta={{ itemLabel: "entry" }} status />}
        />
    );
});
