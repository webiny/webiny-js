import React, { useEffect, useState } from "react";
import { FileItem } from "@webiny/app-admin/types";
import { useSecurity } from "@webiny/app-security";
import { Settings } from "~/types";
import { useFileManagerApi } from "~/index";
import { Action, initializeState, State, StateQueryParams, stateReducer } from "./stateReducer";
import {
    ListFilesListFilesResponse,
    ListFilesQueryVariables
} from "~/modules/FileManagerApiProvider/graphql";
import { FOLDER_ID_DEFAULT } from "~/constants/folders";
import { useRecords } from "@webiny/app-aco";

const DEFAULT_SCOPE = "scope:";
export const getWhere = (scope: string | undefined) => {
    if (!scope) {
        return {
            tag_not_startsWith: DEFAULT_SCOPE
        };
    }
    return {
        tag_startsWith: scope
    };
};

export interface FileManagerViewContextData<TFileItem extends FileItem = FileItem> {
    state: State;
    dispatch: React.Dispatch<Action>;
    getFile: (id: string) => Promise<TFileItem | undefined>;
    createFile: (data: TFileItem) => Promise<TFileItem | undefined>;
    updateFile: (id: string, data: Partial<TFileItem>) => Promise<void>;
    deleteFile: (id: string) => Promise<void>;
    uploadFile: (file: File) => Promise<TFileItem | undefined>;
    files: TFileItem[];
    loadingFiles: boolean;
    loadMore: () => void;
    tags: string[];
    settings: Settings | undefined;
    selected: TFileItem[];
    setSelected: (files: TFileItem[]) => void;
    toggleSelected: (file: TFileItem) => void;
    hasPreviouslyUploadedFiles: boolean | null;
    setHasPreviouslyUploadedFiles: (flag: boolean) => void;
    queryParams: StateQueryParams;
    setQueryParams: (queryParams: StateQueryParams) => void;
    dragging: boolean;
    setDragging: (state: boolean) => void;
    uploading: boolean;
    setUploading: (state: boolean) => void;
    showFileDetails: (id: string) => void;
    showingFileDetails: string | null;
    hideFileDetails: () => void;
    currentFolder?: string;
    setCurrentFolder: (folderId: string | undefined) => void;
    listTable: boolean;
    setListTable: (mode: boolean) => void;
}

function nonEmptyArray(value: string[] | undefined, fallback: string[] | undefined = undefined) {
    if (Array.isArray(value)) {
        return value.length ? value : undefined;
    }

    return fallback;
}

export const FileManagerViewContext = React.createContext<FileManagerViewContextData | undefined>(
    undefined
);

export interface FileManagerViewProviderProps {
    accept: string[];
    tags: string[];
    scope?: string;
    own?: boolean;
    children: React.ReactNode;
}

export const FileManagerViewProvider = ({ children, ...props }: FileManagerViewProviderProps) => {
    const { identity } = useSecurity();
    const fileManager = useFileManagerApi();
    const { getRecord } = useRecords();
    const [files, setFiles] = useState<FileItem[]>([]);
    const [tags, setTags] = useState<string[]>([]);
    const [meta, setMeta] = useState<ListFilesListFilesResponse["meta"]>();
    const [settings, setSettings] = useState<Settings | undefined>(undefined);
    const [loadingFiles, setLoading] = useState(false);
    const [currentFolder, setCurrentFolder] = useState<string>();
    const [listTable, setListTable] = useState<boolean>(false);

    const [state, dispatch] = React.useReducer(
        stateReducer,
        { ...props, identity },
        initializeState
    );

    const queryParamsToWhereInput = (queryParams: StateQueryParams): ListFilesQueryVariables => {
        return {
            limit: queryParams.limit,
            sort: queryParams.sort,
            where: {
                ...getWhere(props.scope),
                createdBy: queryParams.createdBy,
                search: queryParams.search,
                tag_in: nonEmptyArray(addScopePrefix(queryParams.tags)),
                type_in: nonEmptyArray(queryParams.types)
            }
        };
    };

    const getFile = async (id: string) => {
        const fileInState = files.find(file => file.id === id);

        if (fileInState) {
            return fileInState;
        }

        setLoading(true);

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
                const result = [
                    ...prevFiles.slice(0, fileIndex),
                    {
                        ...prevFiles[fileIndex],
                        ...file
                    },
                    ...prevFiles.slice(fileIndex + 1)
                ];

                return result;
            });
        }

        setLoading(false);

        return file;
    };

    const listFiles = async () => {
        setLoading(true);
        const { files, meta } = await fileManager.listFiles(
            queryParamsToWhereInput(state.queryParams)
        );
        setLoading(false);
        setFiles(
            files.map(file => {
                file.tags = removeScopePrefix(file.tags || []);
                return file;
            })
        );
        setMeta(meta);
        if (state.hasPreviouslyUploadedFiles === null) {
            setHasPreviouslyUploadedFiles(files.length > 0);
        }
    };

    const listTags = async () => {
        const tags = await fileManager.listTags({
            where: getWhere(props.scope)
        });

        setTags(
            tags.map(tag => {
                return tag.tag;
            })
        );
    };

    const getSettings = async () => {
        const settings = await fileManager.getSettings();

        setSettings(settings);
    };

    useEffect(() => {
        //listTags();
        getSettings();
    }, []);

    useEffect(() => {
        //listFiles();
    }, [JSON.stringify(state.queryParams)]);

    const setHasPreviouslyUploadedFiles: FileManagerViewContextData["setHasPreviouslyUploadedFiles"] =
        state => {
            dispatch({ type: "hasPreviouslyUploadedFiles", state });
        };

    const loadMore = async () => {
        if (!meta?.cursor) {
            return;
        }

        const response = await fileManager.listFiles({
            ...queryParamsToWhereInput(state.queryParams),
            after: meta?.cursor
        });

        setFiles(files => {
            return [
                ...files,
                ...response.files.map(file => {
                    file.tags = removeScopePrefix(file.tags || []);
                    return file;
                })
            ];
        });
        setMeta(response.meta);
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
                folderId: currentFolder || FOLDER_ID_DEFAULT
            }
        };

        const newFile = await fileManager.createFile(data, meta);
        if (newFile) {
            newFile.tags = removeScopePrefix(newFile.tags || []);
            setFiles(files => [newFile, ...files]);
            await getRecord(newFile.id);
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

        setTags(tags => {
            // Create an array of unique tags
            return Array.from(new Set([...tags, ...(data.tags || [])]));
        });

        await getRecord(id);
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

        // Sync ACO record - retrieve the most updated record from network
        await getRecord(id);
    };

    /**
     * Upload native browser File
     * @see https://developer.mozilla.org/en-US/docs/Web/API/File
     * @param File file
     */
    const uploadFile = async (file: File) => {
        const tags = props.scope ? [props.scope] : [];

        const meta = {
            location: {
                folderId: currentFolder || FOLDER_ID_DEFAULT
            }
        };

        const newFile = await fileManager.uploadFile(file, meta, { tags });
        if (newFile) {
            newFile.tags = removeScopePrefix(newFile.tags);
            setFiles(files => [newFile, ...files]);
            await getRecord(newFile.id);
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

    const value: FileManagerViewContextData = {
        state,
        dispatch,
        files,
        loadingFiles,
        loadMore,
        tags: removeScopePrefix(tags),
        getFile,
        createFile,
        updateFile,
        deleteFile,
        uploadFile,
        settings,
        selected: state.selected,
        setSelected(files: FileItem[]) {
            dispatch({
                type: "setSelected",
                files
            });
        },
        toggleSelected(file: FileItem) {
            dispatch({
                type: "toggleSelected",
                file
            });
        },
        hasPreviouslyUploadedFiles: state.hasPreviouslyUploadedFiles,
        setHasPreviouslyUploadedFiles,
        queryParams: state.queryParams,
        setQueryParams(queryParams: StateQueryParams) {
            dispatch({ type: "queryParams", queryParams });
        },
        setDragging(state = true) {
            dispatch({
                type: "dragging",
                state
            });
        },
        dragging: state.dragging,
        setUploading(state = true) {
            dispatch({
                type: "uploading",
                state
            });
        },
        uploading: state.uploading,
        showFileDetails(id: string) {
            dispatch({ type: "showFileDetails", id });
        },
        hideFileDetails() {
            dispatch({ type: "showFileDetails", id: null });
        },
        showingFileDetails: state.showingFileDetails,
        currentFolder,
        setCurrentFolder,
        listTable,
        setListTable
    };

    return (
        <FileManagerViewContext.Provider value={value}>{children}</FileManagerViewContext.Provider>
    );
};
