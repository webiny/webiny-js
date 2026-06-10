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
import { CmsAdvancedSearch } from "./CmsAdvancedSearch.js";

export const ContentEntriesListLayout = observer(() => {
    const presenter = useContentEntriesPresenter();

    if (!presenter.vm.model) {
        return null;
    }

    if (presenter.vm.showingEntry) {
        return <ContentEntryFormView />;
    }

    return <DocumentList />;
});

const DocumentList = observer(() => {
    const presenter = useContentEntriesPresenter();
    const { browser } = useContentEntryListConfig();
    const { showDialog: showCreateFolderDialog } = useCreateDialog();

    const folderId = presenter.folders.vm.currentFolderId ?? "root";
    const isRoot = folderId === "root";
    const hasFolders =
        presenter.vm.showFolders && presenter.folders.vm.childFolders.length > 0;

    const onCreateFolder = useCallback(() => {
        showCreateFolderDialog({ currentParentId: folderId });
    }, [folderId]);

    const onCreateEntry = useCallback(() => {
        presenter.createEntry();
    }, [presenter]);

    return (
        <ListView
            list={presenter.list.vm}
            actions={presenter.list.actions}
            namespace={`cms/${presenter.vm.model!.modelId}/list`}
            showingFilters={presenter.list.vm.showingFilters}
            onToggleFilters={() => {
                presenter.list.vm.showingFilters
                    ? presenter.list.actions.filter.hide()
                    : presenter.list.actions.filter.show();
            }}
            sidebar={
                <ListView.Sidebar title={presenter.vm.model!.name}>
                    <ListView.Sidebar.Section grow>
                        <FolderTree
                            vm={presenter.folders.vm}
                            actions={presenter.folders}
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
                        text: isRoot
                            ? "Home"
                            : presenter.folders.vm.currentFolderTitle
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
                >
                    <CmsAdvancedSearch />
                </ListView.Filters>
            }
            content={
                <ListView.Content
                    empty={
                        hasFolders ? undefined : (
                            <EmptyView
                                title={"No entries yet. Create your first entry."}
                                action={
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
