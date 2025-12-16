import React, { useCallback, useEffect, useMemo } from "react";
import omit from "lodash/omit.js";
import { useShiftKey, useStateIfMounted } from "@webiny/app-admin";
import type { FileItem } from "@webiny/app-admin/types.js";
import type { FileTag } from "~/types.js";
import { useFileManagerApi } from "~/index.js";
import type { State } from "./state.js";
import { initializeState } from "./state.js";
import type { ListMeta, ListSearchRecordsSort } from "@webiny/app-aco/types.js";
import type { UploadOptions } from "@webiny/app/types.js";
import { sortTableItems } from "@webiny/app-aco/sorting.js";
import { useListFolders, useNavigateFolder } from "@webiny/app-aco";
import type { ListFilesQueryVariables } from "~/modules/FileManagerApiProvider/graphql.js";
import { useListFiles } from "./useListFiles.js";
import { useTags } from "./useTags.js";
import { setSelection } from "./setSelection.js";
import { ROOT_FOLDER } from "~/constants.js";
import type { FolderDto } from "@webiny/app-aco";

type PublicState = Omit<State, "activeTags">;

export interface UpdateFileOptions {
    localUpdate?: boolean;
}

export interface DeleteFileOptions {
    localDelete?: boolean;
}

export interface FileManagerViewContext<TFileItem extends FileItem = FileItem> extends PublicState {
    accept: string[];
    currentFolder: FolderDto | null;
    createFile: (data: TFileItem) => Promise<TFileItem | undefined>;
    deleteFile: (id: string, options?: DeleteFileOptions) => Promise<void>;
    files: FileItem[];
    folderId: string;
    folders: FolderDto[];
    displaySubFolders: boolean;
    getFile: (id: string) => Promise<TFileItem | undefined>;
    hideFileDetails: () => void;
    hideFilters: () => void;
    isListLoading: boolean;
    isListLoadingMore: boolean;
    isRootFolder: boolean;
    isUploadProgressIndicatorVisible: boolean;
    hasOnSelectCallback: boolean;
    listTitle: string;
    loadMoreFiles: () => void;
    meta: ListMeta;
    moveFileToFolder: (fileId: string, folderId: string) => Promise<void>;
    multiple: boolean;
    onClose: () => void;
    onChange: (value: FileItem[] | FileItem) => void;
    onUploadCompletion: (files: FileItem[]) => void;
    own: boolean;
    scope?: string;
    setDragging: (state: boolean) => void;
    setDisplaySubFolders: (state: boolean) => void;
    setFilters: (data: Record<string, any>) => void;
    setFolderId: (folderId: string) => void;
    setListSort: (state: ListSearchRecordsSort) => void;
    setListTable: (mode: boolean) => void;
    setIsUploadProgressIndicatorVisible: (visible: boolean) => void;
    setSearchQuery: (query: string) => void;
    setSelected: (files: TFileItem[]) => void;
    showFileDetails: (id: string) => void;
    showFilters: () => void;
    tags: {
        allTags: FileTag[];
        activeTags: string[];
        setActiveTags: (tags: string[]) => void;
        filterMode: "AND" | "OR";
        setFilterMode(mode: "AND" | "OR"): void;
        loading: boolean;
    };
    toggleSelected: (file: TFileItem) => void;
    deselectAll: () => void;
    updateFile: (
        id: string,
        data: Partial<TFileItem>,
        options?: UpdateFileOptions
    ) => Promise<void>;
    uploadFile: (file: File, options?: UploadFileOptions) => Promise<TFileItem | undefined>;
    overlay?: boolean;
}

export const FileManagerViewContext = React.createContext<FileManagerViewContext | undefined>(
    undefined
);

const getCurrentFolderList = (
    folders?: FolderDto[] | null,
    currentFolderId?: string
): FolderDto[] | [] => {
    if (!folders) {
        return [];
    }
    if (!currentFolderId || currentFolderId.toLowerCase() === ROOT_FOLDER) {
        return folders.filter(
            folder => !folder.parentId || folder.parentId.toLowerCase() === ROOT_FOLDER
        );
    }
    return folders.filter(folder => folder.parentId === currentFolderId);
};

export interface FileManagerViewProviderProps {
    onChange?: (value: FileItem[] | FileItem, context: FileManagerViewContext) => void;
    onClose?: () => void;
    multiple?: boolean;
    accept: string[];
    maxSize?: number | string;
    multipleMaxCount?: number;
    multipleMaxSize?: number | string;
    onUploadCompletion?: (files: FileItem[], context: FileManagerViewContext) => void;
    tags?: string[];
    scope?: string;
    own?: boolean;
    overlay?: boolean;
    children?: React.ReactNode;
}

type UploadFileOptions = Pick<UploadOptions, "onProgress">;

export type Loading<T extends string> = { [P in T]?: boolean };
export type LoadingActions = "INIT" | "LIST" | "LIST_MORE";

export const FileManagerViewProvider = ({ children, ...props }: FileManagerViewProviderProps) => {
    const shiftKeyPressed = useShiftKey();
    const modifiers = { scope: props.scope, own: props.own, accept: props.accept };
    const fileManager = useFileManagerApi();
    const { folders: originalFolders, loading: foldersLoading } = useListFolders();
    const { currentFolderId, navigateToFolder, isRootFolder } = useNavigateFolder();
    const tags = useTags(modifiers);
    const [state, setState] = useStateIfMounted(initializeState());

    const { loading, files, meta, listFiles, setFiles, setMeta, getListVariables } = useListFiles({
        folderId: currentFolderId,
        modifiers,
        state
    });

    useEffect(() => {
        loadFiles("INIT");
    }, []);

    useEffect(() => {
        loadFiles("LIST");
    }, [state.searchQuery, state.filters, state.activeTags, state.listSort, state.tagsFilterMode]);

    const loadFiles = async (action: LoadingActions, params?: Partial<ListFilesQueryVariables>) => {
        if (loading.INIT || loading[action]) {
            return;
        }
        const queryVariables = getListVariables();
        await listFiles({ ...queryVariables, ...params });
        setState(state => ({
            ...state,
            isSearch: Boolean(state.searchQuery || state.filters || state.activeTags.length)
        }));
    };

    const loadMoreFiles = () => {
        if (meta.cursor) {
            loadFiles("LIST_MORE", { after: meta.cursor });
        }
    };

    const resetSearchParameters = (folderId: string) => {
        const folder = (originalFolders || []).find(folder => folder.id === folderId);
        const isRoot = folder ? folder.id === ROOT_FOLDER : false;

        setState(state => ({
            ...state,
            selection: {},
            filters: undefined,
            searchQuery: "",
            activeTags: [],
            searchLabel:
                folder && !isRoot ? `Search files in "${folder.title}"` : `Search all files`
        }));
    };

    const { folders, listTitle } = useMemo(() => {
        // Filter sub-folders and sort them accordingly
        const subFolders = getCurrentFolderList(originalFolders, currentFolderId);
        const folders = sortTableItems(subFolders, state.listSort, { name: "title" });

        // Get current folder name
        const currentFolder = originalFolders?.find(folder => folder.id === currentFolderId);

        return { folders, listTitle: currentFolder?.title || "" };
    }, [originalFolders, currentFolderId, state.listSort]);

    const getFile = async (id: string) => {
        const fileInState = files.find(file => file.id === id);

        if (fileInState) {
            return fileInState;
        }

        const file = await fileManager.getFile(id);

        if (!file) {
            // No file found - must be deleted by previous operation
            setFiles(files => files.filter(file => file.id !== id));
            // Decrease totalCount without performing a new API call
            setMeta(meta => ({
                ...meta,
                totalCount: --meta.totalCount
            }));
        } else {
            setFiles(prevFiles => {
                const fileIndex = prevFiles.findIndex(file => file.id === id);

                // No record found in the list - must be added by previous operation
                if (fileIndex === -1) {
                    return [...prevFiles, file];
                }

                // Updating record found in the list
                return [
                    ...prevFiles.slice(0, fileIndex),
                    {
                        ...prevFiles[fileIndex],
                        ...file
                    },
                    ...prevFiles.slice(fileIndex + 1)
                ];
            });
            // Increase totalCount without performing a new API call
            setMeta(meta => ({
                ...meta,
                totalCount: ++meta.totalCount
            }));
        }

        return file;
    };

    const getSettings = async () => {
        const settings = await fileManager.getSettings();
        setState(state => ({
            ...state,
            settings
        }));
    };

    useEffect(() => {
        getSettings();
    }, []);

    const createFile = async (data: FileItem) => {
        if (data.tags) {
            data.tags = addScopePrefix(data.tags);
        }

        if (props.scope) {
            data.tags = [...(data.tags || []), props.scope];
        }

        const meta = {
            location: {
                folderId: currentFolderId
            }
        };

        const newFile = await fileManager.createFile(data, meta);
        if (newFile) {
            newFile.tags = removeScopePrefix(newFile.tags || []);
            setFiles(files => [newFile, ...files]);
            // Increase totalCount without performing a new API call
            setMeta(meta => ({
                ...meta,
                totalCount: ++meta.totalCount
            }));
        }
        return newFile;
    };

    const updateFile = async (
        id: string,
        data: Partial<FileItem>,
        options: UpdateFileOptions = {}
    ) => {
        const file = files.find(file => file.id === id);

        if (!file) {
            return;
        }

        const { localUpdate = false } = options;

        const newTags = data.tags?.filter(tag => !tags.tags.some(t => t.tag === tag));

        if (data.tags) {
            data.tags = addScopePrefix(data.tags);
        }

        if (props.scope) {
            data.tags = [...(data.tags || []), props.scope];
        }

        if (!localUpdate) {
            await fileManager.updateFile(id, data);
        }

        if (newTags) {
            tags.addTags(newTags);
        }

        setFiles(files => {
            const index = files.findIndex(file => file.id === id);

            if (index === -1) {
                return files;
            }

            const newFile = {
                ...data,
                tags: removeScopePrefix(data.tags)
            };

            return [
                ...files.slice(0, index),
                { ...files[index], ...newFile },
                ...files.slice(index + 1)
            ];
        });
    };

    const deleteFile = async (id: string, options: DeleteFileOptions = {}) => {
        const { localDelete = false } = options;

        if (!localDelete) {
            await fileManager.deleteFile(id);
        }

        setFiles(files => {
            const index = files.findIndex(file => file.id === id);
            if (index === -1) {
                return files;
            }

            // Decrease totalCount without performing a new API call
            setMeta(meta => ({
                ...meta,
                totalCount: --meta.totalCount
            }));

            return [...files.slice(0, index), ...files.slice(index + 1)];
        });
    };

    /**
     * Upload native browser File
     * @see https://developer.mozilla.org/en-US/docs/Web/API/File
     * @param file
     * @param options
     */
    const uploadFile: FileManagerViewContext["uploadFile"] = async (file, options = {}) => {
        const tags = props.scope ? [props.scope] : [];
        const meta = {
            location: {
                folderId: currentFolderId
            }
        };

        const newFile = await fileManager.uploadFile(file, meta, {
            tags,
            onProgress: options.onProgress
        });
        if (newFile) {
            newFile.tags = removeScopePrefix(newFile.tags);
            setFiles(files => [newFile, ...files]);
            // Increase totalCount without performing a new API call
            setMeta(meta => ({
                ...meta,
                totalCount: ++meta.totalCount
            }));
        }
        return newFile;
    };

    const moveFileToFolder: FileManagerViewContext["moveFileToFolder"] = async (
        fileId,
        folderId
    ) => {
        await updateFile(fileId, { location: { folderId } });
        setFiles(files => files.filter(file => file.id !== fileId));
        // Decrease totalCount without performing a new API call
        setMeta(meta => ({
            ...meta,
            totalCount: --meta.totalCount
        }));
    };

    const addScopePrefix = (tags: string[] = []) => {
        if (!props.scope) {
            return tags;
        }

        return tags.map(tag => `${props.scope}:${tag}`);
    };

    const removeScopePrefix = (tags: string[] = []) => {
        if (!props.scope) {
            return tags;
        }

        return tags
            .filter(tag => tag !== props.scope)
            .map(tag => {
                return props.scope ? tag.replace(`${props.scope}:`, "") : tag;
            });
    };

    const context: FileManagerViewContext = {
        ...omit(state, ["activeTags"]),
        accept: props.accept,
        hasOnSelectCallback: Boolean(props.onChange),
        createFile,
        deleteFile,
        files,
        folderId: currentFolderId,
        currentFolder: originalFolders.find(folder => folder.id === currentFolderId) ?? null,
        folders: state.isSearch ? [] : folders,
        getFile,
        hideFileDetails() {
            setState(state => ({
                ...state,
                showingFileDetails: null
            }));
        },
        hideFilters() {
            setState(state => ({
                ...state,
                filters: undefined,
                showingFilters: false
            }));
        },
        isListLoading: Boolean(
            loading.INIT || foldersLoading.INIT || loading.LIST || foldersLoading.LIST
        ),
        isListLoadingMore: Boolean(loading.LIST_MORE),
        isRootFolder: Boolean(isRootFolder),
        listTitle,
        loadMoreFiles,
        meta,
        moveFileToFolder,
        multiple: Boolean(props.multiple),
        onChange(value: FileItem[] | FileItem) {
            if (typeof props.onChange === "function") {
                props.onChange(value, context);
            }
        },
        onClose() {
            if (typeof props.onClose === "function") {
                props.onClose();
            }
        },
        onUploadCompletion(files) {
            setState(state => ({
                ...state,
                hasPreviouslyUploadedFiles: true
            }));

            if (typeof props.onUploadCompletion === "function") {
                props.onUploadCompletion(files, context);
            }
        },
        own: Boolean(props.own),
        overlay: props.overlay ?? true,
        scope: props.scope,
        setDragging(value = true) {
            setState(state => ({
                ...state,
                dragging: value
            }));
        },
        setDisplaySubFolders(value: boolean) {
            setState(state => ({
                ...state,
                displaySubFolders: value
            }));
        },
        setFilters(data) {
            // Create filters object excluding entries with `undefined` values
            const filters = Object.fromEntries(
                Object.entries(data).filter(([, value]) => value !== undefined)
            );

            setState(state => ({
                ...state,
                selected: [],
                filters: Object.keys(filters).length ? filters : undefined,
                selection: {}
            }));
        },
        setFolderId(folderId) {
            resetSearchParameters(folderId);
            navigateToFolder(folderId);
        },
        setIsUploadProgressIndicatorVisible(visible: boolean) {
            setState(state => ({
                ...state,
                isUploadProgressIndicatorVisible: visible
            }));
        },
        setListSort(sort: ListSearchRecordsSort) {
            setState(state => ({
                ...state,
                listSort: sort
            }));
        },
        setListTable(flag) {
            setState(state => ({
                ...state,
                listTable: flag
            }));
        },
        setSearchQuery(search) {
            setState(state => ({
                ...state,
                searchQuery: search
            }));
        },
        setSelected(files: FileItem[]) {
            setState(state => ({
                ...state,
                selected: files
            }));
        },
        showFileDetails: useCallback((id: string) => {
            setState(state => ({
                ...state,
                showingFileDetails: id
            }));
        }, []),
        showFilters() {
            setState(state => ({
                ...state,
                showingFilters: true
            }));
        },
        tags: {
            loading: tags.loading,
            allTags: tags.tags,
            activeTags: state.activeTags,
            filterMode: state.tagsFilterMode,
            setFilterMode(mode) {
                setState(state => ({
                    ...state,
                    tagsFilterMode: mode
                }));
            },
            setActiveTags(activeTags) {
                setState(state => ({
                    ...state,
                    activeTags
                }));
            }
        },
        toggleSelected(file: FileItem) {
            setState(state =>
                setSelection({
                    state,
                    files,
                    toggledFile: file,
                    shiftKeyPressed
                })
            );
        },
        deselectAll() {
            setState(state => ({ ...state, selected: [] }));
        },
        updateFile,
        uploadFile
    };

    return (
        <FileManagerViewContext.Provider value={context}>
            {children}
        </FileManagerViewContext.Provider>
    );
};
