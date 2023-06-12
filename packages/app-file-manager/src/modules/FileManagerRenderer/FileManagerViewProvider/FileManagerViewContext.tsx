import React, { useCallback, useEffect, useState } from "react";
import debounce from "lodash/debounce";
import { FileItem } from "@webiny/app-admin/types";
import { useSecurity } from "@webiny/app-security";
import { FileTag, Settings } from "~/types";
import { useFileManagerApi } from "~/index";
import {
    getMimeTypeWhereParams,
    getScopeWhereParams,
    initializeState,
    State
} from "./stateReducer";
import { FolderItem, ListMeta, ListSearchRecordsSort } from "@webiny/app-aco/types";
import { UploadOptions } from "@webiny/app/types";
import { sortTableItems } from "@webiny/app-aco/sorting";
import { useFolders, useNavigateFolder } from "@webiny/app-aco";
import {
    ListFilesQueryVariables,
    ListFilesWhereLocation,
    ListFilesWhereQueryVariables
} from "~/modules/FileManagerApiProvider/graphql";
import { useListFiles } from "./useListFiles";
import { useTags } from "./useTags";

export interface FileManagerViewContextData<TFileItem extends FileItem = FileItem> {
    getFile: (id: string) => Promise<TFileItem | undefined>;
    createFile: (data: TFileItem) => Promise<TFileItem | undefined>;
    deleteFile: (id: string) => Promise<void>;
    updateFile: (id: string, data: Partial<TFileItem>) => Promise<void>;
    uploadFile: (file: File, options?: UploadFileOptions) => Promise<TFileItem | undefined>;
    dragging: boolean;
    files: FileItem[];
    tags: {
        allTags: FileTag[];
        activeTags: string[];
        setActiveTags: (tags: string[]) => void;
        loading: boolean;
    };
    meta: ListMeta | undefined;
    folderId?: string;
    folders: FolderItem[];
    hasPreviouslyUploadedFiles: boolean | null;
    hideFileDetails: () => void;
    hideFilters: () => void;
    isListLoading: boolean;
    isListLoadingMore: boolean;
    listSort: ListSearchRecordsSort | undefined;
    listTable: boolean;
    listTitle: string | undefined;
    loadingFileDetails: boolean;
    loadMoreFiles: () => void;
    searchQuery: string;
    selected: TFileItem[];
    setDragging: (state: boolean) => void;
    setFilters: (data: Record<string, any>) => void;
    setHasPreviouslyUploadedFiles: (flag: boolean) => void;
    setListSort: (state: ListSearchRecordsSort) => void;
    setListTable: (mode: boolean) => void;
    setSearchQuery: (query: string) => void;
    setSelected: (files: TFileItem[]) => void;
    settings: Settings | undefined;
    showFileDetails: (id: string) => void;
    showFilters: () => void;
    showingFileDetails: string | null;
    showingFilters: boolean;
    toggleSelected: (file: TFileItem) => void;
}

export const FileManagerViewContext = React.createContext<FileManagerViewContextData | undefined>(
    undefined
);

const getCurrentFolderList = (
    folders?: FolderItem[] | null,
    currentFolderId?: string
): FolderItem[] | [] => {
    if (!folders) {
        return [];
    }
    if (!currentFolderId || currentFolderId.toLowerCase() === "root") {
        return folders.filter(
            folder => !folder.parentId || folder.parentId.toLowerCase() === "root"
        );
    }
    return folders.filter(folder => folder.parentId === currentFolderId);
};

export interface FileManagerViewProviderProps {
    accept: string[];
    tags: string[];
    scope?: string;
    own?: boolean;
    children: React.ReactNode;
}

type UploadFileOptions = Pick<UploadOptions, "onProgress">;

export type Loading<T extends string> = { [P in T]?: boolean };
export type LoadingActions = "INIT" | "LIST" | "LIST_MORE";

function nonEmptyArray(value: string[] | undefined, fallback: string[] | undefined = undefined) {
    if (Array.isArray(value)) {
        return value.length ? value : undefined;
    }

    return fallback;
}

export const FileManagerViewProvider: React.VFC<FileManagerViewProviderProps> = ({
    children,
    ...props
}) => {
    const { identity } = useSecurity();
    const fileManager = useFileManagerApi();
    const [settings, setSettings] = useState<Settings | undefined>(undefined);
    const [listTable, setListTable] = useState<boolean>(false);
    const [folders, setFolders] = useState<FolderItem[]>([]);
    const [listTitle, setListTitle] = useState<string | undefined>();
    const {
        folders: originalFolders,
        loading: foldersLoading,
        getDescendantFolders
    } = useFolders();
    const { currentFolderId = "ROOT" } = useNavigateFolder();
    const { loading, files, meta, listFiles, setFiles } = useListFiles();
    const tags = useTags({ scope: props.scope, own: props.own });

    const [state, setState] = useState(
        initializeState({ ...props, identity, folderId: currentFolderId || "ROOT" })
    );

    const queryParamsToWhereInput = (state: State) => {
        const isSearch = state.searchQuery || state.filters || state.activeTags.length;

        const AND: ListFilesWhereQueryVariables[] = [];

        if (state.filters) {
            AND.push(state.filters);
        }

        if (Array.isArray(state.listWhere.AND)) {
            AND.push(...state.listWhere.AND);
        }

        if (state.activeTags.length) {
            AND.push({ tags_in: state.activeTags });
        }

        let locationWhere: ListFilesWhereLocation | undefined = {
            folderId: currentFolderId
        };

        if (isSearch) {
            if (currentFolderId === "ROOT") {
                locationWhere = undefined;
            } else {
                locationWhere = {
                    folderId_in: getDescendantFolders(currentFolderId)
                };
            }
        }

        const queryParams: ListFilesQueryVariables = {
            limit: 50,
            sort: state.listSort,
            search: state.searchQuery || undefined,
            where: {
                ...getScopeWhereParams(props.scope),
                ...getMimeTypeWhereParams(props.accept),
                location: locationWhere,
                createdBy: props.own ? identity!.id : undefined,
                tags_in: nonEmptyArray(addScopePrefix(state.listWhere.tags_in)),
                AND: AND.filter(Boolean) as ListFilesWhereQueryVariables[]
            }
        };

        if (!queryParams.where?.AND?.length) {
            delete queryParams.where?.AND;
        }

        return queryParams;
    };

    const loadFiles = debounce(
        (action: LoadingActions, params?: Partial<ListFilesQueryVariables>) => {
            if (loading.INIT || loading[action]) {
                return;
            }
            const queryVariables = queryParamsToWhereInput(state);
            listFiles({ ...queryVariables, ...params });
        },
        50
    );

    const loadMoreFiles = () => {
        if (meta?.cursor) {
            loadFiles("LIST_MORE", { after: meta.cursor });
        }
    };

    useEffect(() => {
        loadFiles("INIT");
    }, []);

    useEffect(() => {
        loadFiles("LIST");
    }, [state.listWhere, state.searchQuery, state.filters, state.activeTags]);

    useEffect(() => {
        setState(state => ({
            ...state,
            filters: undefined,
            searchQuery: "",
            activeTags: []
        }));
    }, [currentFolderId]);

    /**
     * Any time we receive a `folders` list update:
     * - we return the list filtered by the current `type` and parent `folderId`, sorted according to the current `sort` value;
     * - we return the current folder name.
     */
    useEffect(() => {
        const subFolders = getCurrentFolderList(originalFolders, currentFolderId);
        setFolders(() => {
            return sortTableItems(subFolders, state.listSort);
        });

        const currentFolder = originalFolders?.find(folder => folder.id === currentFolderId);
        setListTitle(currentFolder?.title || undefined);
    }, [originalFolders, currentFolderId]);

    const getFile = async (id: string) => {
        const fileInState = files.find(file => file.id === id);

        if (fileInState) {
            return fileInState;
        }

        setState(state => ({
            ...state,
            loadingFileDetails: true
        }));

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

        setState(state => ({
            ...state,
            loadingFileDetails: false
        }));

        return file;
    };

    const getSettings = async () => {
        const settings = await fileManager.getSettings();
        setSettings(settings);
    };

    useEffect(() => {
        getSettings();
    }, []);

    const setHasPreviouslyUploadedFiles: FileManagerViewContextData["setHasPreviouslyUploadedFiles"] =
        flag => {
            setState(state => ({
                ...state,
                hasPreviouslyUploadedFiles: flag
            }));
        };

    const createFile = async (data: FileItem) => {
        if (data.tags) {
            data.tags = addScopePrefix(data.tags);
        }

        if (props.scope) {
            data.tags = [...(data.tags || []), props.scope];
        }

        const meta = {
            location: {
                folderId: currentFolderId || "ROOT"
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

        if (data.tags) {
            data.tags = addScopePrefix(data.tags);
        }

        if (props.scope) {
            data.tags = [...(data.tags || []), props.scope];
        }

        await fileManager.updateFile(id, data);

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
    const uploadFile: FileManagerViewContextData["uploadFile"] = async (file, options = {}) => {
        const tags = props.scope ? [props.scope] : [];
        const meta = {
            location: {
                folderId: currentFolderId || "ROOT"
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

    const setSearchQuery: FileManagerViewContextData["setSearchQuery"] = useCallback(
        // @ts-ignore
        debounce(search => {
            setState(state => ({
                ...state,
                searchQuery: search
            }));
        }, 500),
        [currentFolderId]
    );

    const value: FileManagerViewContextData = {
        files,
        getFile,
        createFile,
        updateFile,
        deleteFile,
        uploadFile,
        settings,
        selected: state.selected,
        hasPreviouslyUploadedFiles: state.hasPreviouslyUploadedFiles,
        setHasPreviouslyUploadedFiles,
        listSort: state.listSort,
        dragging: state.dragging,
        showingFileDetails: state.showingFileDetails,
        showingFilters: state.showingFilters,
        loadingFileDetails: state.loadingFileDetails,
        loadMoreFiles,
        meta,
        folderId: currentFolderId,
        isListLoading: Boolean(
            loading.INIT || foldersLoading.INIT || loading.LIST || foldersLoading.LIST
        ),
        isListLoadingMore: Boolean(loading.LIST_MORE),
        listTable,
        folders,
        tags: {
            loading: tags.loading,
            allTags: tags.tags,
            activeTags: state.activeTags,
            setActiveTags(activeTags) {
                setState(state => ({
                    ...state,
                    activeTags
                }));
            }
        },
        listTitle,
        setListTable,
        setSearchQuery,
        searchQuery: state.searchQuery,
        setSelected(files: FileItem[]) {
            setState(state => ({
                ...state,
                selected: files
            }));
        },
        toggleSelected(file: FileItem) {
            setState(state => {
                const existingIndex = state.selected.findIndex(item => item.src === file.src);
                const selected = state.selected;

                if (existingIndex < 0) {
                    selected.push(file);
                } else {
                    selected.splice(existingIndex, 1);
                }

                return {
                    ...state,
                    selected
                };
            });
        },
        setListSort(sort: ListSearchRecordsSort) {
            setState(state => ({
                ...state,
                listSort: sort
            }));
        },
        setFilters(data) {
            setState(state => ({
                ...state,
                selected: [],
                filters: data
            }));
        },
        setDragging(value = true) {
            setState(state => ({
                ...state,
                dragging: value
            }));
        },
        showFileDetails(id: string) {
            setState(state => ({
                ...state,
                showingFileDetails: id
            }));
        },
        hideFileDetails() {
            setState(state => ({
                ...state,
                showingFileDetails: null
            }));
        },
        showFilters() {
            setState(state => ({
                ...state,
                showingFilters: true
            }));
        },
        hideFilters() {
            setState(state => ({
                ...state,
                showingFilters: false
            }));
        }
    };

    return (
        <FileManagerViewContext.Provider value={value}>{children}</FileManagerViewContext.Provider>
    );
};
