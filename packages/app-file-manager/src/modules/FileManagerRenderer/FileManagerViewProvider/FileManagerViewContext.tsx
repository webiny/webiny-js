import React, { useCallback, useEffect, useMemo, useState } from "react";
import omit from "lodash/omit";
import { useShiftKey } from "@webiny/app-admin";
import { FileItem } from "@webiny/app-admin/types";
import { FileTag } from "~/types";
import { useFileManagerApi } from "~/index";
import { initializeState, State } from "./state";
import { FolderItem, ListMeta, ListSearchRecordsSort } from "@webiny/app-aco/types";
import { UploadOptions } from "@webiny/app/types";
import { sortTableItems } from "@webiny/app-aco/sorting";
import { useFolders, useNavigateFolder } from "@webiny/app-aco";
import { ListFilesQueryVariables } from "~/modules/FileManagerApiProvider/graphql";
import { useListFiles } from "./useListFiles";
import { useTags } from "./useTags";
import { setSelection } from "./setSelection";
import { ROOT_FOLDER } from "~/constants";

type PublicState = Omit<State, "activeTags">;

export interface FileManagerViewContext<TFileItem extends FileItem = FileItem> extends PublicState {
    accept: string[];
    createFile: (data: TFileItem) => Promise<TFileItem | undefined>;
    deleteFile: (id: string) => Promise<void>;
    files: FileItem[];
    folderId: string;
    folders: FolderItem[];
    getFile: (id: string) => Promise<TFileItem | undefined>;
    hideFileDetails: () => void;
    hideFilters: () => void;
    isListLoading: boolean;
    isListLoadingMore: boolean;
    hasOnSelectCallback: boolean;
    listTitle: string;
    loadMoreFiles: () => void;
    meta: ListMeta | undefined;
    moveFileToFolder: (fileId: string, folderId: string) => Promise<void>;
    multiple: boolean;
    onClose: () => void;
    onChange: (value: FileItem[] | FileItem) => void;
    onUploadCompletion: (files: FileItem[]) => void;
    own: boolean;
    scope?: string;
    setDragging: (state: boolean) => void;
    setFilters: (data: Record<string, any>) => void;
    setFolderId: (folderId: string) => void;
    setListSort: (state: ListSearchRecordsSort) => void;
    setListTable: (mode: boolean) => void;
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
    updateFile: (id: string, data: Partial<TFileItem>) => Promise<void>;
    uploadFile: (file: File, options?: UploadFileOptions) => Promise<TFileItem | undefined>;
}

export const FileManagerViewContext = React.createContext<FileManagerViewContext | undefined>(
    undefined
);

const getCurrentFolderList = (
    folders?: FolderItem[] | null,
    currentFolderId?: string
): FolderItem[] | [] => {
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
    onChange?: (value: FileItem[] | FileItem) => void;
    onClose?: () => void;
    multiple?: boolean;
    accept: string[];
    maxSize?: number | string;
    multipleMaxCount?: number;
    multipleMaxSize?: number | string;
    onUploadCompletion?: (files: FileItem[]) => void;
    tags?: string[];
    scope?: string;
    own?: boolean;
    children?: React.ReactNode;
}

type UploadFileOptions = Pick<UploadOptions, "onProgress">;

export type Loading<T extends string> = { [P in T]?: boolean };
export type LoadingActions = "INIT" | "LIST" | "LIST_MORE";

export const FileManagerViewProvider = ({ children, ...props }: FileManagerViewProviderProps) => {
    const shiftKeyPressed = useShiftKey();
    const modifiers = { scope: props.scope, own: props.own, accept: props.accept };
    const fileManager = useFileManagerApi();
    const { folders: originalFolders, loading: foldersLoading } = useFolders();
    const { currentFolderId = ROOT_FOLDER, navigateToFolder } = useNavigateFolder();
    const tags = useTags(modifiers);
    const [state, setState] = useState(initializeState());

    const { loading, files, meta, listFiles, setFiles, getListVariables } = useListFiles({
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
        if (meta?.cursor) {
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
                folderId: currentFolderId || ROOT_FOLDER
            }
        };

        const newFile = await fileManager.createFile(data, meta);
        if (newFile) {
            newFile.tags = removeScopePrefix(newFile.tags || []);
            setFiles(files => [newFile, ...files]);
        }
        return newFile;
    };

    const updateFile = async (id: string, data: Partial<FileItem>) => {
        const file = files.find(file => file.id === id);
        if (!file) {
            return;
        }

        const newTags = data.tags?.filter(tag => !tags.tags.some(t => t.tag === tag));

        if (data.tags) {
            data.tags = addScopePrefix(data.tags);
        }

        if (props.scope) {
            data.tags = [...(data.tags || []), props.scope];
        }

        await fileManager.updateFile(id, data);

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

    const deleteFile = async (id: string) => {
        await fileManager.deleteFile(id);

        setFiles(files => {
            const index = files.findIndex(file => file.id === id);
            if (index === -1) {
                return files;
            }

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
                folderId: currentFolderId || ROOT_FOLDER
            }
        };

        const newFile = await fileManager.uploadFile(file, meta, {
            tags,
            onProgress: options.onProgress
        });
        if (newFile) {
            newFile.tags = removeScopePrefix(newFile.tags);
            setFiles(files => [newFile, ...files]);
        }
        return newFile;
    };

    const moveFileToFolder: FileManagerViewContext["moveFileToFolder"] = async (
        fileId,
        folderId
    ) => {
        await updateFile(fileId, { location: { folderId } });
        setFiles(files => files.filter(file => file.id !== fileId));
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
        listTitle,
        loadMoreFiles,
        meta,
        moveFileToFolder,
        multiple: Boolean(props.multiple),
        onChange(value: FileItem[] | FileItem) {
            if (typeof props.onChange === "function") {
                props.onChange(value);
            }

            context.onClose();
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
                props.onUploadCompletion(files);
                context.onClose();
            }
        },
        own: Boolean(props.own),
        scope: props.scope,
        setDragging(value = true) {
            setState(state => ({
                ...state,
                dragging: value
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
