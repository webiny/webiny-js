import React, { useMemo, useEffect, useCallback } from "react";
import { DiContainerProvider, useContainer, useFeature } from "@webiny/app";
import { observer } from "mobx-react-lite";
import {
    BrowserFilePicker,
    type BrowserFilePickerRenderProps
} from "@webiny/app-admin/presentation/browserFilePicker/index.js";
import debounce from "lodash/debounce.js";
import { Heading, OverlayLoader, ScrollArea, Separator, useToast } from "@webiny/admin-ui";
import { i18n } from "@webiny/app/i18n/index.js";
import {
    LeftPanel,
    OverlayLayout,
    RightPanel,
    SplitView,
    DialogsProvider,
    useHotkeys
} from "@webiny/app-admin";
import { FoldersFeature } from "@webiny/app-aco/features/folders/feature.js";
import { FolderTreePresenterFeature } from "@webiny/app-aco/presentation/folderTree/feature.js";
import { FileManagerPresenterFeature } from "~/presentation/FileList/feature.js";
import {
    FileManagerPresenterProvider,
    useFileManagerPresenter
} from "~/presentation/FileList/FileManagerPresenterProvider.js";
import { FileDetailsPresenterFeature } from "~/presentation/FileDetails/feature.js";
import { SharedCacheFeature } from "~/features/shared/feature.js";
import { ListFilesFeature } from "~/features/listFiles/feature.js";
import { GetFileFeature } from "~/features/getFile/feature.js";
import { DeleteFileFeature } from "~/features/deleteFile/feature.js";
import { UpdateFileFeature } from "~/features/updateFile/feature.js";
import { FileUploaderFeature } from "~/features/fileUploader/feature.js";
import { ListTagsFeature } from "~/features/tags/feature.js";
import { GetSettingsFeature } from "~/features/settings/feature.js";
import {
    FileManagerViewWithConfig,
    useFileManagerConfig
} from "~/presentation/config/FileManagerViewConfig.js";
import { FolderTree } from "@webiny/app-aco/presentation/folderTree/FolderTree.js";
import { BottomInfoBar } from "~/presentation/FileList/components/BottomInfoBar/index.js";
import { BulkActionBar } from "~/presentation/FileList/components/BulkActions/index.js";
import { FileDropPlaceholder } from "~/presentation/FileList/components/FileDropPlaceholder/index.js";
import { Empty } from "~/presentation/FileList/components/Empty/index.js";
import { FileDetailsDrawer } from "~/presentation/FileDetails/components/FileDetailsDrawer.js";
import { FileGrid } from "~/presentation/FileList/components/Grid/index.js";
import { FileManagerHeader } from "~/presentation/FileList/components/Header/FileManagerHeader.js";
import { FileTable } from "~/presentation/FileList/components/Table/index.js";
import { TagsList } from "~/presentation/FileList/components/TagsList/index.js";
import { UploadProgress } from "~/presentation/FileList/components/Upload/index.js";
import { GetSettingsRepository } from "~/features/settings/abstractions.js";
import { OverlayProvider, useOverlay } from "./OverlayContext.js";
import { RouteParamsSync } from "./RouteParamsSync.js";

import type { FmFile } from "~/features/shared/types.js";
import type {
    FileError,
    SelectedFile
} from "@webiny/app-admin/presentation/browserFilePicker/index.js";
import { outputFileSelectionError } from "~/presentation/FileManager/outputFileSelectionError.js";
import type { ScrollPosition } from "@webiny/admin-ui";

export interface FileManagerViewProps {
    overlay?: boolean;
    onChange?: (files: FmFile[]) => void;
    onClose?: () => void;
    multiple?: boolean;
    accept?: string[];
    scope?: string;
    children?: React.ReactNode;
}

const t = i18n.ns("app-admin/file-manager/file-manager-view");

// ---------------------------------------------------------------------------
// Layout — uses original UI components, wired to the presenter.
// ---------------------------------------------------------------------------

const FileManagerViewLayout = observer(function FileManagerViewLayout() {
    const { vm, actions } = useFileManagerPresenter();
    const { browser } = useFileManagerConfig();
    const overlay = useOverlay();
    const toast = useToast();

    useHotkeys({
        zIndex: 20,
        keys: {
            esc: () => overlay && overlay.onClose()
        }
    });

    const container = useContainer();
    const settingsRepository = useMemo(() => container.resolve(GetSettingsRepository), [container]);
    const settings = settingsRepository.settings;

    const uploadFiles = async (files: SelectedFile[]) => {
        await actions.upload(files);
        toast.showSuccessToast({ title: "File upload complete." });
    };

    const onError = useCallback((errors: FileError[]) => {
        const message = outputFileSelectionError(errors);
        if (message) {
            toast.showWarningToast({ title: message });
        } else {
            toast.showWarningToast({ title: "Couldn't process selected files." });
            console.error(errors);
        }
    }, []);

    const loadMoreOnScroll = useCallback(
        debounce(async (scrollFrame: ScrollPosition) => {
            if (scrollFrame.top > 0.8) {
                void actions.loadMore();
            }
        }, 200),
        [vm.list.pagination, actions]
    );

    if (!vm.fileModel) {
        return <OverlayLoader text={t`Preparing File Manager...`} />;
    }

    const renderList = (browseFiles: BrowserFilePickerRenderProps["browseFiles"]) => {
        if (vm.loading) {
            return <OverlayLoader text={t`Loading files...`} size={"lg"} />;
        }

        if (vm.empty) {
            return <Empty isSearchResult={!vm.showFolders} browseFiles={browseFiles} />;
        }

        if (vm.viewMode === "table") {
            return (
                <ScrollArea onScroll={loadMoreOnScroll}>
                    <FileTable />
                </ScrollArea>
            );
        }

        return (
            <ScrollArea onScroll={loadMoreOnScroll}>
                <FileGrid />
            </ScrollArea>
        );
    };

    const content = (
        <BrowserFilePicker
            multiple
            maxSize={settings ? settings.uploadMaxFileSize + "b" : "1TB"}
            multipleMaxSize={"1TB"}
            accept={overlay?.accept ?? []}
            onSuccess={uploadFiles}
            onError={onError}
        >
            {({ getDropZoneProps, browseFiles }) => (
                <>
                    <FileDetailsDrawer />
                    <SplitView namespace={"fm/file/list"}>
                        <LeftPanel span={2}>
                            <div className={"flex flex-col h-main-content"}>
                                <div className={"py-sm px-md"}>
                                    <Heading level={5}>{t`File Manager`}</Heading>
                                </div>
                                <Separator />
                                <div className={"shrink-0 overflow-y-auto max-h-[66vh]"}>
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
                                        <div className={"flex-1 overflow-y-auto min-h-0"}>
                                            <TagsList
                                                loading={false}
                                                activeTags={
                                                    (vm.list.filters["tags"] as string[]) ?? []
                                                }
                                                tags={vm.tags.map(tag => ({
                                                    tag: tag.tag,
                                                    count: tag.count
                                                }))}
                                                onActivatedTagsChange={tags => {
                                                    if (tags.length > 0) {
                                                        actions.filter.set("tags", tags);
                                                    } else {
                                                        actions.filter.clear("tags");
                                                        actions.filter.clear("tags_rule");
                                                    }
                                                }}
                                            />
                                        </div>
                                    </>
                                ) : null}
                            </div>
                        </LeftPanel>
                        <RightPanel span={10}>
                            <div
                                className={"flex flex-col relative"}
                                style={{ height: "calc(100vh - 45px" }}
                            >
                                <FileManagerHeader browseFiles={browseFiles} />
                                <div
                                    className={"flex-1"}
                                    {...getDropZoneProps({
                                        onDragEnter: () => actions.setDragging(true),
                                        onDrop: () => actions.setDragging(false),
                                        onDragLeave: (e: React.DragEvent) => {
                                            if (
                                                !e.relatedTarget ||
                                                !e.currentTarget.contains(e.relatedTarget as Node)
                                            ) {
                                                actions.setDragging(false);
                                            }
                                        }
                                    })}
                                    data-testid={"fm-list-wrapper"}
                                >
                                    {!overlay && <BulkActionBar />}
                                    {renderList(browseFiles)}
                                    {vm.dragging && <FileDropPlaceholder />}
                                    <UploadProgress />
                                </div>
                                <BottomInfoBar
                                    accept={overlay?.accept ?? []}
                                    listing={vm.list.pagination.loadingMore}
                                    loading={vm.list.pagination.loading}
                                    totalCount={vm.list.pagination.totalCount}
                                    currentCount={vm.list.pagination.currentCount}
                                />
                            </div>
                        </RightPanel>
                    </SplitView>
                </>
            )}
        </BrowserFilePicker>
    );

    if (overlay) {
        return (
            <OverlayLayout variant={"strong"} onExited={() => overlay.onClose()}>
                {content}
            </OverlayLayout>
        );
    }

    return content;
});

// ---------------------------------------------------------------------------
// Inner component that resolves the presenter from the scoped container.
// ---------------------------------------------------------------------------

const FileManagerViewInner = observer(
    ({
        overlay = false,
        onChange,
        onClose,
        multiple,
        accept,
        scope,
        children
    }: FileManagerViewProps) => {
        const { presenter } = useFeature(FileManagerPresenterFeature);

        const overlayConfig = useMemo(() => {
            if (!overlay || !onChange || !onClose) {
                return null;
            }

            const handleFileClick = (file: FmFile) => {
                if (multiple) {
                    presenter.actions.selection.toggle(file.id);
                } else {
                    onChange([file]);
                }
            };

            const confirmSelection = () => {
                const selectedIds = presenter.vm.list.selection.selectedIds;
                const selectedFiles = presenter.vm.list.rows.filter(f => selectedIds.has(f.id));
                if (selectedFiles.length > 0) {
                    onChange(selectedFiles);
                }
            };

            return {
                onFileClick: handleFileClick,
                confirmSelection,
                onClose,
                accept: accept ?? [],
                multiple: multiple ?? false
            };
        }, [overlay, onChange, onClose, multiple, accept]);

        useEffect(() => {
            presenter.init({ scope });
            return () => presenter.dispose();
        }, [presenter, overlay, scope]);

        const inner = (
            <DialogsProvider>
                <FileManagerViewWithConfig>
                    <FileManagerPresenterProvider presenter={presenter}>
                        <FileManagerViewLayout />
                        {children}
                        {!overlayConfig && <RouteParamsSync />}
                    </FileManagerPresenterProvider>
                </FileManagerViewWithConfig>
            </DialogsProvider>
        );

        if (overlayConfig) {
            return <OverlayProvider config={overlayConfig}>{inner}</OverlayProvider>;
        }

        return inner;
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
