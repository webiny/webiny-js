import React, { useState, useCallback, useMemo, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useContainer } from "@webiny/app";
import { useLocalStorage } from "@webiny/app/exports/admin/local-storage.js";
import { FileManagerViewContext } from "~/modules/FileManagerRenderer/FileManagerViewProvider/FileManagerViewContext.js";
import type { FileManagerViewContext as FileManagerViewContextType } from "~/modules/FileManagerRenderer/FileManagerViewProvider/FileManagerViewContext.js";
import type { IFileListPresenter } from "../FileList/abstractions.js";
import type { IFileDetailsPresenter } from "../FileDetails/abstractions.js";
import type { FileItem } from "~/types.js";
import type { Settings } from "~/types.js";
import type { FolderDto } from "@webiny/app-aco";
import type { ListMeta } from "@webiny/app-aco/types.js";
import type { ListSearchRecordsSort } from "@webiny/app-aco/types.js";
import type { FmFile } from "../../features/shared/types.js";
import type { FmTag } from "../../features/shared/types.js";
import type { IFolderTreeNode } from "@webiny/app-aco/presentation/folderTree/abstractions.js";
import { GetFileUseCase } from "../../features/getFile/abstractions.js";
import { DeleteFileUseCase } from "../../features/deleteFile/abstractions.js";
import { UpdateFileUseCase } from "../../features/updateFile/abstractions.js";
import { GetSettingsRepository } from "../../features/settings/abstractions.js";
import { FileUploader } from "../../features/fileUploader/abstractions.js";
import type { IFileListOverlayConfig } from "../FileList/abstractions.js";
import { ROOT_FOLDER } from "~/constants.js";
import { LOCAL_STORAGE_LATEST_VISITED_FOLDER } from "~/constants.js";

interface FileManagerViewAdapterProps {
    fileListPresenter: IFileListPresenter;
    fileDetailsPresenter: IFileDetailsPresenter;
    overlayConfig?: IFileListOverlayConfig;
    children: React.ReactNode;
}

// Map an FmFile (SDK type) to a FileItem (legacy GraphQL type).
function toFileItem(file: FmFile): FileItem {
    return {
        id: file.id,
        name: file.name,
        key: file.key,
        src: file.src,
        size: file.size,
        type: file.type,
        tags: file.tags,
        createdOn:
            typeof file.createdOn === "string" ? file.createdOn : file.createdOn.toISOString(),
        createdBy: {
            id: file.createdBy.id,
            displayName: file.createdBy.displayName
        },
        savedOn: typeof file.savedOn === "string" ? file.savedOn : file.savedOn.toISOString(),
        savedBy: {
            id: file.savedBy.id,
            displayName: file.savedBy.displayName
        },
        modifiedOn: file.modifiedOn
            ? typeof file.modifiedOn === "string"
                ? file.modifiedOn
                : file.modifiedOn.toISOString()
            : "",
        modifiedBy: file.modifiedBy
            ? { id: file.modifiedBy.id, displayName: file.modifiedBy.displayName }
            : { id: "", displayName: "" },
        location: { folderId: file.location.folderId },
        metadata: file.metadata as FileItem["metadata"],
        accessControl: file.accessControl
    };
}

// Map an IFolderTreeNode to a FolderDto-compatible object.
function toFolderDto(node: IFolderTreeNode): FolderDto {
    const emptyIdentity = { id: "", displayName: "", type: "" };
    return {
        id: node.id,
        title: node.name,
        slug: node.slug,
        type: "FmFile",
        parentId: node.parentId,
        path: "",
        permissions: [],
        hasNonInheritedPermissions: false,
        canManagePermissions: false,
        canManageStructure: true,
        canManageContent: true,
        createdBy: emptyIdentity,
        createdOn: "",
        savedBy: emptyIdentity,
        savedOn: "",
        modifiedBy: null,
        modifiedOn: null,
        extensions: {}
    };
}

// Flatten a folder tree into a list of FolderDto objects.
function flattenTree(nodes: IFolderTreeNode[]): FolderDto[] {
    const result: FolderDto[] = [];
    for (const node of nodes) {
        result.push(toFolderDto(node));
        if (node.children.length > 0) {
            result.push(...flattenTree(node.children));
        }
    }
    return result;
}

// Convert presenter sort to the legacy ListSearchRecordsSort format.
function toListSort(
    sort: { field: string; direction: "ASC" | "DESC" } | null
): ListSearchRecordsSort {
    if (!sort) {
        return [];
    }
    return [`${sort.field}_${sort.direction}`];
}

// Convert FmTag[] to the legacy FileTag shape.
function toFileTags(tags: FmTag[]): { tag: string; count: number }[] {
    return tags.map(t => ({ tag: t.tag, count: t.count }));
}

// Map FmSettings to the legacy Settings shape.
function toSettings(repo: GetSettingsRepository.Interface): Settings | undefined {
    const s = repo.settings;
    if (!s) {
        return undefined;
    }
    return {
        uploadMinFileSize: s.uploadMinFileSize,
        uploadMaxFileSize: s.uploadMaxFileSize,
        srcPrefix: s.srcPrefix
    };
}

export const FileManagerViewAdapter = observer(function FileManagerViewAdapter({
    fileListPresenter,
    fileDetailsPresenter,
    overlayConfig,
    children
}: FileManagerViewAdapterProps) {
    const container = useContainer();
    const localStorage = useLocalStorage();

    // Restore last visited folder from localStorage on mount.
    useEffect(() => {
        const storedFolderId = localStorage.get(LOCAL_STORAGE_LATEST_VISITED_FOLDER);
        if (storedFolderId && storedFolderId !== ROOT_FOLDER) {
            actions.folders.selectFolder(storedFolderId);
        }
    }, []);

    // Resolve use cases from DI.
    const getFileUseCase = useMemo(() => container.resolve(GetFileUseCase), [container]);
    const deleteFileUseCase = useMemo(() => container.resolve(DeleteFileUseCase), [container]);
    const updateFileUseCase = useMemo(() => container.resolve(UpdateFileUseCase), [container]);
    const settingsRepository = useMemo(() => container.resolve(GetSettingsRepository), [container]);
    const fileUploader = useMemo(() => container.resolve(FileUploader), [container]);

    // Local UI state not managed by the presenter.
    const [showingFileDetails, setShowingFileDetails] = useState<string | null>(null);
    const [showingFilters, setShowingFilters] = useState(false);
    const [activeTags, setActiveTags] = useState<string[]>([]);
    const [tagsFilterMode, setTagsFilterMode] = useState<"AND" | "OR">("OR");
    const [dragging, setDragging] = useState(false);

    const vm = fileListPresenter.vm;
    const actions = fileListPresenter.actions;

    // Derive files as FileItem[].
    const files: FileItem[] = vm.list.rows.map(toFileItem);

    // Derive selected files from selection IDs.
    const selected: FileItem[] = useMemo(() => {
        const ids = vm.list.selection.selectedIds;
        return vm.list.rows.filter(f => ids.has(f.id)).map(toFileItem);
    }, [vm.list.selection.selectedIds, vm.list.rows]);

    // Derive folders.
    const allFolders = useMemo(() => flattenTree(vm.folders.tree), [vm.folders.tree]);
    const currentFolderNode = vm.folders.currentFolder;
    const currentFolder = currentFolderNode ? toFolderDto(currentFolderNode) : null;
    const folderId = vm.folders.currentFolderId ?? ROOT_FOLDER;
    const isRootFolder = vm.folders.currentFolderId === null;

    // Derive child folders of the current folder.
    const folders: FolderDto[] = useMemo(() => {
        if (vm.list.search || Object.keys(vm.list.filters).length > 0) {
            return [];
        }
        // At root, show top-level folders (parentId is null or ROOT_FOLDER).
        if (isRootFolder) {
            return allFolders.filter(f => !f.parentId || f.parentId === ROOT_FOLDER);
        }
        return allFolders.filter(f => f.parentId === vm.folders.currentFolderId);
    }, [allFolders, vm.folders.currentFolderId, isRootFolder, vm.list.search, vm.list.filters]);

    const listTitle = currentFolderNode?.name ?? "Home";

    // Meta for pagination.
    const meta: ListMeta = useMemo(
        () => ({
            cursor: vm.list.pagination.hasMore ? "cursor" : null,
            totalCount: vm.list.pagination.totalCount,
            hasMoreItems: vm.list.pagination.hasMore
        }),
        [vm.list.pagination]
    );

    // Action: getFile.
    const getFile = useCallback(
        async (id: string): Promise<FileItem | undefined> => {
            const result = await getFileUseCase.execute({ id });
            if (result.success) {
                return toFileItem(result.file);
            }
            return undefined;
        },
        [getFileUseCase]
    );

    // Action: createFile (pass-through, returns the file as-is).
    const createFile = useCallback(async (data: FileItem): Promise<FileItem | undefined> => {
        // The new architecture does not expose a createFile use case through the presenter.
        // This is a no-op stub; file creation goes through the upload flow.
        return data;
    }, []);

    // Action: deleteFile.
    const deleteFile = useCallback(
        async (id: string): Promise<void> => {
            await deleteFileUseCase.execute({ id });
        },
        [deleteFileUseCase]
    );

    // Action: updateFile.
    const updateFile = useCallback(
        async (id: string, data: Partial<FileItem>): Promise<void> => {
            await updateFileUseCase.execute({ id, data });
        },
        [updateFileUseCase]
    );

    // Action: uploadFile.
    const uploadFile = useCallback(
        async (file: File): Promise<FileItem | undefined> => {
            await fileUploader.upload(file, {
                name: file.name,
                type: file.type,
                location: { folderId }
            });
            return undefined;
        },
        [fileUploader, folderId]
    );

    // Action: moveFileToFolder.
    const moveFileToFolder = useCallback(
        async (fileId: string, targetFolderId: string): Promise<void> => {
            await updateFileUseCase.execute({
                id: fileId,
                data: { location: { folderId: targetFolderId } }
            });
        },
        [updateFileUseCase]
    );

    const context: FileManagerViewContextType = {
        // State fields.
        displaySubFolders: vm.list.filters["includeSubFolders"] !== false,
        dragging,
        filters:
            Object.keys(vm.list.filters).length > 0
                ? (vm.list.filters as Record<string, any>)
                : undefined,
        isSearch: Boolean(
            vm.list.search || Object.keys(vm.list.filters).length > 0 || activeTags.length > 0
        ),
        isUploadProgressIndicatorVisible: vm.upload.isUploading,
        limit: 50,
        listSort: toListSort(vm.list.sort),
        listTable: vm.viewMode === "table",
        searchLabel:
            currentFolderNode && !isRootFolder
                ? `Search files in "${currentFolderNode.name}"`
                : "Search all files",
        searchQuery: vm.list.search,
        selected,
        selection: {},
        settings: toSettings(settingsRepository),
        showingFileDetails,
        showingFilters,
        tagsFilterMode,

        // Computed / derived fields.
        accept: overlayConfig?.accept ?? [],
        currentFolder,
        files,
        folderId,
        folders,
        isListLoading: vm.list.pagination.loading,
        isListLoadingMore: vm.list.pagination.loadingMore,
        isRootFolder,
        hasOnSelectCallback: vm.isOverlay,
        listTitle,
        meta,
        multiple: overlayConfig?.multiple ?? false,
        own: false,
        overlay: vm.isOverlay,
        scope: overlayConfig?.scope,

        // Action methods.
        createFile,
        deleteFile,
        getFile,
        hideFileDetails: useCallback(() => setShowingFileDetails(null), []),
        hideFilters: useCallback(() => setShowingFilters(false), []),
        loadMoreFiles: useCallback(() => {
            void actions.loadMore();
        }, [actions]),
        moveFileToFolder,
        onChange: useCallback(
            (value: FileItem[] | FileItem) => {
                if (!overlayConfig) {
                    return;
                }
                const files = Array.isArray(value) ? value : [value];
                overlayConfig.onChange(files.map(f => f as unknown as FmFile));
            },
            [overlayConfig]
        ),
        onClose: useCallback(() => {
            overlayConfig?.onClose();
        }, [overlayConfig]),
        onUploadCompletion: useCallback(() => {
            // No-op in the new architecture.
        }, []),
        setDragging: useCallback((value = true) => setDragging(value), []),
        setDisplaySubFolders: useCallback(
            (value: boolean) => {
                actions.filter.set("includeSubFolders", value);
            },
            [actions]
        ),
        setFilters: useCallback(
            (data: Record<string, any>) => {
                // Clear existing filters first, then set new ones.
                actions.filter.clearAll();
                for (const [key, value] of Object.entries(data)) {
                    if (value !== undefined) {
                        actions.filter.set(key, value);
                    }
                }
            },
            [actions]
        ),
        setFolderId: useCallback(
            (id: string) => {
                localStorage.set(LOCAL_STORAGE_LATEST_VISITED_FOLDER, id);
                actions.folders.selectFolder(id === ROOT_FOLDER ? null : id);
            },
            [actions, localStorage]
        ),
        setIsUploadProgressIndicatorVisible: useCallback(() => {
            // Controlled by the presenter; no-op here.
        }, []),
        setListSort: useCallback(
            (sort: ListSearchRecordsSort) => {
                if (!sort || sort.length === 0) {
                    return;
                }
                // Parse "field_DIRECTION" format.
                const item = sort[0];
                const lastUnderscore = item.lastIndexOf("_");
                const field = item.substring(0, lastUnderscore);
                const direction = item.substring(lastUnderscore + 1) as "ASC" | "DESC";
                actions.sort.set(field, direction);
            },
            [actions]
        ),
        setListTable: useCallback(
            (flag: boolean) => {
                actions.setViewMode(flag ? "table" : "grid");
            },
            [actions]
        ),
        setSearchQuery: useCallback(
            (query: string) => {
                actions.search.set(query);
            },
            [actions]
        ),
        setSelected: useCallback(
            (files: FileItem[]) => {
                actions.selection.selectRows(files.map(f => f.id));
            },
            [actions]
        ),
        showFileDetails: useCallback(
            (id: string) => {
                setShowingFileDetails(id);
                void fileDetailsPresenter.loadFile(id);
            },
            [fileDetailsPresenter]
        ),
        showFilters: useCallback(() => setShowingFilters(true), []),
        tags: {
            allTags: toFileTags(vm.tags),
            activeTags,
            setActiveTags: (tags: string[]) => {
                setActiveTags(tags);
                // Sync active tags to the presenter filter.
                if (tags.length > 0) {
                    actions.filter.set("tags", tags);
                } else {
                    actions.filter.clear("tags");
                }
            },
            filterMode: tagsFilterMode,
            setFilterMode: (mode: "AND" | "OR") => {
                setTagsFilterMode(mode);
                actions.filter.set("tagsFilterMode", mode);
            },
            loading: false
        },
        toggleSelected: useCallback(
            (file: FileItem) => {
                actions.selection.toggle(file.id);
            },
            [actions]
        ),
        deselectAll: useCallback(() => {
            actions.selection.deselectAll();
        }, [actions]),
        updateFile,
        uploadFile
    };

    return (
        <FileManagerViewContext.Provider value={context}>
            {children}
        </FileManagerViewContext.Provider>
    );
});
