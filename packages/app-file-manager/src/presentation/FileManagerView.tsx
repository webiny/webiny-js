import React, { useMemo, useEffect, useCallback, useState } from "react";
import { DiContainerProvider, useContainer, useFeature } from "@webiny/app";
import { observer } from "mobx-react-lite";
import type { FilesRenderChildren } from "react-butterfiles";
import Files from "react-butterfiles";
import debounce from "lodash/debounce.js";
import type { positionValues } from "react-custom-scrollbars";
import { type DataTableSorting, Heading, Scrollbar, Separator } from "@webiny/admin-ui";
import { i18n } from "@webiny/app/i18n/index.js";
import {
    LeftPanel,
    OverlayLayout,
    RightPanel,
    SplitView,
    useHotkeys,
    useSnackbar,
    DialogsProvider
} from "@webiny/app-admin";
import { FoldersFeature } from "@webiny/app-aco/features/folders/feature.js";
import { FolderTreePresenterFeature } from "@webiny/app-aco/presentation/folderTree/feature.js";
import { FileManagerPresenterFeature } from "./FileList/feature.js";
import {
    FileManagerPresenterProvider,
    useFileManagerPresenter
} from "./FileList/FileManagerPresenterProvider.js";
import { FileDetailsPresenterFeature } from "./FileDetails/feature.js";
import { SharedCacheFeature } from "../features/shared/feature.js";
import { ListFilesFeature } from "../features/listFiles/feature.js";
import { GetFileFeature } from "../features/getFile/feature.js";
import { DeleteFileFeature } from "../features/deleteFile/feature.js";
import { UpdateFileFeature } from "../features/updateFile/feature.js";
import { FileUploaderFeature } from "../features/fileUploader/feature.js";
import { ListTagsFeature } from "../features/tags/feature.js";
import { GetSettingsFeature } from "../features/settings/feature.js";
import {
    FileManagerViewWithConfig,
    useFileManagerViewConfig
} from "~/modules/FileManagerRenderer/FileManagerView/FileManagerViewConfig.js";
import { outputFileSelectionError } from "~/modules/FileManagerRenderer/FileManagerView/outputFileSelectionError.js";
import { FolderTree } from "@webiny/app-aco/presentation/folderTree/FolderTree.js";
import { BottomInfoBar } from "~/components/BottomInfoBar/index.js";
import { BulkActions } from "~/components/BulkActions/index.js";
import { FileDropPlaceholder } from "~/components/FileDropPlaceholder/index.js";
import { Empty } from "~/components/Empty/index.js";
import { FileDetails } from "~/components/FileDetails/index.js";
import { Filters } from "~/components/Filters/index.js";
import { Grid } from "~/components/Grid/index.js";
import { Header } from "~/components/Header/index.js";
import type { TableProps } from "~/components/Table/index.js";
import { Table } from "~/components/Table/index.js";
import { TagsList } from "~/components/TagsList/index.js";
import { UploadStatus } from "~/components/UploadStatus/index.js";
import { FolderOperationDialog } from "./FileList/components/FolderTree/FolderTreeSidebar.js";
import { ROOT_FOLDER } from "~/constants.js";
import { GetSettingsRepository } from "~/features/settings/abstractions.js";
import { toFolderDto } from "./adapters/toFolderDto.js";

import type { FmFile } from "../features/shared/types.js";
import type { FileItem, TableItem } from "~/types.js";
import type { IFileManagerOverlayConfig } from "./FileList/abstractions.js";
import type { ListFilesSort, ListFilesSortItem } from "~/modules/FileManagerApiProvider/graphql.js";

export interface FileManagerViewProps {
    onChange?: (files: FmFile[]) => void;
    onClose?: () => void;
    multiple?: boolean;
    accept?: string[];
    scope?: string;
    children?: React.ReactNode;
}

const t = i18n.ns("app-admin/file-manager/file-manager-view");

type GetFileUploadErrorMessageProps =
    | string
    | {
          message: string;
      };

const createSort = (sorting?: DataTableSorting): ListFilesSort | undefined => {
    if (!sorting?.length) {
        return undefined;
    }
    return sorting.reduce<ListFilesSort>((items, item) => {
        const sort = `${item.id}_${item.desc ? "DESC" : "ASC"}` as ListFilesSortItem;
        if (items.includes(sort)) {
            return items;
        }
        items.push(sort);
        return items;
    }, []);
};

// ---------------------------------------------------------------------------
// Layout — uses original UI components, wired to the presenter.
// ---------------------------------------------------------------------------

const FileManagerViewLayout = observer(function FileManagerViewLayout() {
    const { vm, actions } = useFileManagerPresenter();
    const { browser } = useFileManagerViewConfig();
    const { showSnackbar } = useSnackbar();

    const container = useContainer();
    const settingsRepository = useMemo(
        () => container.resolve(GetSettingsRepository),
        [container]
    );
    const settings = settingsRepository.settings;

    const [tableSorting, setTableSorting] = useState<DataTableSorting>([]);
    const [currentFile, setCurrentFile] = useState<FileItem>();
    const [drawerLoading, setDrawerLoading] = useState<string | null>(null);

    const folderId = vm.folders.currentFolderId ?? ROOT_FOLDER;

    useEffect(() => {
        if (vm.fileDetails?.vm.file) {
            setCurrentFile(vm.fileDetails.vm.file);
            setDrawerLoading(null);
        } else {
            setCurrentFile(undefined);
            setDrawerLoading(null);
        }
    }, [vm.fileDetails?.vm.file]);

    useEffect(() => {
        if (!tableSorting?.length) {
            return;
        }
        const sort = createSort(tableSorting);
        if (!sort) {
            return;
        }
        const item = sort[0];
        const lastUnderscore = item.lastIndexOf("_");
        const field = item.substring(0, lastUnderscore);
        const direction = item.substring(lastUnderscore + 1) as "ASC" | "DESC";
        actions.sort.set(field, direction);
    }, [tableSorting]);

    const getFileUploadErrorMessage = useCallback((e: GetFileUploadErrorMessageProps) => {
        if (typeof e === "string") {
            const match = e.match(/Message>(.*?)<\/Message/);
            if (match) {
                const [, message] = match;
                return message;
            }
            return e;
        }
        return e.message;
    }, []);

    useHotkeys({
        zIndex: 20,
        keys: {
            esc: () => {
                if (vm.isOverlay) {
                    // handled by overlay config
                }
            }
        }
    });

    const uploadFiles = async (files: File[]) => {
        await actions.upload(files);
    };

    const files: FileItem[] = vm.list.rows;
    const folders = useMemo(
        () => vm.folders.childFolders.map(toFolderDto),
        [vm.folders.childFolders]
    );
    const selectedFiles = useMemo(
        () => vm.list.rows.filter(f => vm.list.selection.selectedIds.has(f.id)),
        [vm.list.rows, vm.list.selection.selectedIds]
    );
    const activeFilters = Object.keys(vm.list.filters).filter(k => k !== "folderId");
    const isSearch = Boolean(vm.list.search) || activeFilters.length > 0;

    const loadMoreOnScroll = useCallback(
        debounce(async ({ scrollFrame }: { scrollFrame: positionValues }) => {
            if (scrollFrame.top > 0.8) {
                void actions.loadMore();
            }
        }, 200),
        [vm.list.pagination, actions]
    );

    const updateFile = useCallback(
        async (_data: FileItem) => {
            if (!vm.fileDetails) {
                return;
            }
            setDrawerLoading("Saving file changes...");
            await vm.fileDetails.saveFile();
            setDrawerLoading(null);
            showSnackbar("File updated successfully!");
            actions.hideFileDetails();
        },
        [vm.fileDetails]
    );

    const renderList = (browseFiles: FilesRenderChildren["browseFiles"]) => {
        if (!vm.list.pagination.loading && isSearch && files.length === 0) {
            return <Empty isSearchResult={true} browseFiles={browseFiles} />;
        }

        if (!vm.list.pagination.loading && files.length === 0 && folders.length === 0) {
            return <Empty isSearchResult={false} browseFiles={browseFiles} />;
        }

        if (vm.viewMode === "table") {
            const getSelectableRow = (rows: TableItem[]) =>
                rows.filter(row => row.$type === "RECORD").map(row => row.data as FileItem);

            const onSelectRow: TableProps["onSelectRow"] = vm.isOverlay
                ? rows => {
                      const selected = getSelectableRow(rows);
                      if (vm.multiple) {
                          actions.selection.selectRows(selected.map(f => f.id));
                      } else if (selected[0]) {
                          actions.selectFile(selected[0]);
                      }
                  }
                : rows => {
                      const selected = getSelectableRow(rows);
                      actions.selection.selectRows(selected.map(f => f.id));
                  };

            const onToggleRow: TableProps["onToggleRow"] = vm.isOverlay
                ? row => {
                      const selected = getSelectableRow([row]);
                      if (vm.multiple) {
                          actions.selection.toggle(selected[0]?.id);
                      } else if (selected[0]) {
                          actions.selectFile(selected[0]);
                      }
                  }
                : row => {
                      const selected = getSelectableRow([row]);
                      if (selected[0]) {
                          actions.selection.toggle(selected[0].id);
                      }
                  };

            return (
                <Table
                    onSelectRow={onSelectRow}
                    onToggleRow={onToggleRow}
                    sorting={tableSorting}
                    onSortingChange={setTableSorting}
                />
            );
        }

        return (
            <Grid
                folderActions={browser.folder.actions}
                folders={isSearch ? [] : folders}
                records={files}
                loading={vm.list.pagination.loading}
                onFolderClick={(id: string) =>
                    actions.folders.selectFolder(id === ROOT_FOLDER ? null : id)
                }
                selected={selectedFiles}
                multiple={vm.multiple}
                toggleSelected={(file: FileItem) => actions.selection.toggle(file.id)}
                deselectAll={() => actions.selection.deselectAll()}
                onChange={(value: FileItem[] | FileItem) => {
                    const items = Array.isArray(value) ? value : [value];
                    items.forEach(f => actions.selectFile(f));
                }}
                onClose={() => {}}
                hasOnSelectCallback={vm.isOverlay}
                displaySubFolders={vm.list.filters["includeSubFolders"] !== false}
            />
        );
    };

    const withOverlay = (element: React.ReactElement) => {
        if (vm.isOverlay) {
            return <OverlayLayout variant={"strong"}>{element}</OverlayLayout>;
        }
        return element;
    };

    return (
        <Files
            multiple
            maxSize={settings ? settings.uploadMaxFileSize + "b" : "1TB"}
            multipleMaxSize={"1TB"}
            accept={vm.accept}
            onSuccess={files => {
                const filesToUpload = files
                    .map(file => file.src.file)
                    .filter(Boolean) as File[];
                uploadFiles(filesToUpload);
            }}
            onError={errors => {
                const message = outputFileSelectionError(errors);
                showSnackbar(message);
            }}
        >
            {({ getDropZoneProps, browseFiles }) =>
                withOverlay(
                    <>
                        <FolderOperationDialog />
                        <FileDetails
                            loading={drawerLoading}
                            file={currentFile}
                            open={vm.fileDetails !== null}
                            onClose={() => actions.hideFileDetails()}
                            onSave={updateFile}
                        />
                        <SplitView namespace={"fm/file/list"}>
                            <LeftPanel span={2}>
                                <div className={"flex flex-col h-main-content"}>
                                    <div className={"py-sm px-md"}>
                                        <Heading level={5}>{t`File Manager`}</Heading>
                                    </div>
                                    <Separator />
                                    <div className={"flex-1 overflow-y-scroll"}>
                                        <FolderTree
                                            vm={vm.folders}
                                            actions={actions.folders}
                                            folderActions={browser.folder.actions}
                                            dropConfirmation={browser.folder.dropConfirmation}
                                            enableActions={true}
                                            enableCreate={true}
                                        />
                                    </div>
                                    {browser.filterByTags ? (
                                        <>
                                            <Separator />
                                            <TagsList
                                                loading={false}
                                                activeTags={
                                                    (vm.list.filters["tags"] as string[]) ?? []
                                                }
                                                tags={vm.tags.map(tag => ({
                                                    tag: tag.tag,
                                                    count: tag.count
                                                }))}
                                                onActivatedTagsChange={(tags: string[]) => {
                                                    if (tags.length > 0) {
                                                        actions.filter.set("tags", tags);
                                                    } else {
                                                        actions.filter.clear("tags");
                                                        actions.filter.clear("tags_rule");
                                                    }
                                                }}
                                            />
                                        </>
                                    ) : null}
                                </div>
                            </LeftPanel>
                            <RightPanel span={10}>
                                <div
                                    className={"flex flex-col relative"}
                                    style={{ height: "calc(100vh - 45px" }}
                                >
                                    <Header browseFiles={browseFiles} />
                                    <div
                                        className={"flex-1"}
                                        {...getDropZoneProps({
                                            onDragOver: () => actions.setDragging(true),
                                            onDragLeave: () => actions.setDragging(false),
                                            onDrop: () => actions.setDragging(false)
                                        })}
                                        data-testid={"fm-list-wrapper"}
                                    >
                                        <BulkActions />
                                        <Filters />
                                        <Scrollbar
                                            onScrollFrame={scrollFrame =>
                                                loadMoreOnScroll({ scrollFrame })
                                            }
                                        >
                                            {renderList(browseFiles)}
                                        </Scrollbar>
                                        {vm.dragging && <FileDropPlaceholder />}
                                        <UploadStatus
                                            numberOfFiles={vm.upload.jobs.length}
                                            progress={vm.upload.overallProgress.percentage}
                                            isVisible={vm.upload.isUploading}
                                            setIsVisible={() => {}}
                                        />
                                    </div>
                                    <BottomInfoBar
                                        accept={vm.accept}
                                        listing={vm.list.pagination.loadingMore}
                                        loading={vm.list.pagination.loading}
                                        totalCount={vm.list.pagination.totalCount}
                                        currentCount={vm.list.pagination.currentCount}
                                    />
                                </div>
                            </RightPanel>
                        </SplitView>
                    </>
                )
            }
        </Files>
    );
});

// ---------------------------------------------------------------------------
// Inner component that resolves the presenter from the scoped container.
// ---------------------------------------------------------------------------

const FileManagerViewInner = observer(
    ({ onChange, onClose, multiple, accept, scope, children }: FileManagerViewProps) => {
        const { presenter } = useFeature(FileManagerPresenterFeature);

        const overlayConfig = useMemo<IFileManagerOverlayConfig | undefined>(() => {
            if (!onChange || !onClose) {
                return undefined;
            }
            return { onChange, onClose, multiple, accept, scope };
        }, [onChange, onClose, multiple, accept, scope]);

        useEffect(() => {
            presenter.init(overlayConfig);
        }, [presenter, overlayConfig]);

        return (
            <DialogsProvider>
                <FileManagerViewWithConfig>
                    <FileManagerPresenterProvider presenter={presenter}>
                        <FileManagerViewLayout />
                        {children}
                    </FileManagerPresenterProvider>
                </FileManagerViewWithConfig>
            </DialogsProvider>
        );
    }
);

// ---------------------------------------------------------------------------
// FileManagerView — sets up DI container and renders the inner component.
// ---------------------------------------------------------------------------

export const FileManagerView = (props: FileManagerViewProps) => {
    const container = useContainer();

    const scopedContainer = useMemo(() => {
        const child = container.createChildContainer();

        SharedCacheFeature.register(child);
        FoldersFeature.register(child, { type: "FmFile" });
        FolderTreePresenterFeature.register(child);
        ListFilesFeature.register(child);
        GetFileFeature.register(child);
        DeleteFileFeature.register(child);
        UpdateFileFeature.register(child);
        FileUploaderFeature.register(child);
        ListTagsFeature.register(child);
        GetSettingsFeature.register(child);
        FileDetailsPresenterFeature.register(child);
        FileManagerPresenterFeature.register(child);

        return child;
    }, []);

    return (
        <DiContainerProvider container={scopedContainer}>
            <FileManagerViewInner {...props} />
        </DiContainerProvider>
    );
};
