import React, { useEffect, useState } from "react";
import { UploadOptions } from "@webiny/app/types";
import { FileItem } from "@webiny/app-admin/types";
import { useSecurity } from "@webiny/app-security";
import { Settings } from "~/types";
import { useFileManagerApi } from "~/index";
import { Action, initializeState, State, StateQueryParams, stateReducer } from "./stateReducer";
import {
    ListFilesListFilesResponse,
    ListFilesQueryVariables
} from "~/modules/FileManagerApiProvider/graphql";
import { FOLDER_ID_DEFAULT } from "~/constants";

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
    createFile: (data: TFileItem) => Promise<TFileItem | undefined>;
    updateFile: (id: string, data: Partial<TFileItem>) => Promise<void>;
    deleteFile: (id: string) => Promise<void>;
    uploadFile: (file: File, options?: UploadFileOptions) => Promise<TFileItem | undefined>;
    files: TFileItem[];
    loadingFiles: boolean;
    loadMore: () => void;
    tags: string[];
    settings: Settings | undefined;
    selected: TFileItem[];
    toggleSelected: (file: TFileItem) => void;
    hasPreviouslyUploadedFiles: boolean | null;
    setHasPreviouslyUploadedFiles: (flag: boolean) => void;
    queryParams: StateQueryParams;
    setQueryParams: (queryParams: StateQueryParams) => void;
    dragging: boolean;
    setDragging: (state: boolean) => void;
    showFileDetails: (id: string) => void;
    showingFileDetails: string | null;
    hideFileDetails: () => void;
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

type UploadFileOptions = Pick<UploadOptions, "onProgress">;

export const FileManagerViewProvider = ({ children, ...props }: FileManagerViewProviderProps) => {
    const { identity } = useSecurity();
    const fileManager = useFileManagerApi();
    const [files, setFiles] = useState<FileItem[]>([]);
    const [tags, setTags] = useState<string[]>([]);
    const [meta, setMeta] = useState<ListFilesListFilesResponse["meta"]>();
    const [settings, setSettings] = useState<Settings | undefined>(undefined);
    const [loadingFiles, setLoading] = useState(false);

    const [state, dispatch] = React.useReducer(
        stateReducer,
        { ...props, identity },
        initializeState
    );

    const queryParamsToWhereInput = (queryParams: StateQueryParams): ListFilesQueryVariables => {
        return {
            limit: queryParams.limit,
            where: {
                ...getWhere(props.scope),
                createdBy: queryParams.createdBy,
                tags_in: nonEmptyArray(addScopePrefix(queryParams.tags)),
                type_in: nonEmptyArray(queryParams.types)
            }
        };
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
        listTags();
        getSettings();
    }, []);

    useEffect(() => {
        listFiles();
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
                folderId: FOLDER_ID_DEFAULT
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

        setTags(tags => {
            // Create an array of unique tags
            return Array.from(new Set([...tags, ...(data.tags || [])]));
        });
    };

    const deleteFile = async (id: string) => {
        const file = files.find(file => file.id === id);
        if (!file) {
            return;
        }

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

        const newFile = await fileManager.uploadFile(file, {
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

    const value: FileManagerViewContextData = {
        state,
        dispatch,
        files,
        loadingFiles,
        loadMore,
        tags: removeScopePrefix(tags),
        createFile,
        updateFile,
        deleteFile,
        uploadFile,
        settings,
        selected: state.selected,
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
        showFileDetails(id: string) {
            dispatch({ type: "showFileDetails", id });
        },
        hideFileDetails() {
            dispatch({ type: "showFileDetails", id: null });
        },
        showingFileDetails: state.showingFileDetails
    };

    return (
        <FileManagerViewContext.Provider value={value}>{children}</FileManagerViewContext.Provider>
    );
};
