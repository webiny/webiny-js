import React, { useEffect, useState } from "react";
import { FileItem } from "@webiny/app-admin/types";
import { useSecurity } from "@webiny/app-security";
import { Settings } from "~/types";
import { useFileManagerApi } from "~/index";
import { Action, initializeState, State, StateListWhere, stateReducer } from "./stateReducer";
import { FOLDER_ID_DEFAULT, DEFAULT_SCOPE } from "~/constants";
import { useRecords } from "@webiny/app-aco";
import { ListDbSort } from "@webiny/app-aco/types";
import { FileManagerViewContextData } from "~/modules/FileManagerRenderer/FileManagerViewProvider";
import { UploadOptions } from "@webiny/app/types";

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

export interface FileManagerAcoViewContextData<TFileItem extends FileItem = FileItem> {
    state: State;
    dispatch: React.Dispatch<Action>;
    getFile: (id: string) => Promise<TFileItem | undefined>;
    createFile: (data: TFileItem) => Promise<TFileItem | undefined>;
    updateFile: (id: string, data: Partial<TFileItem>) => Promise<void>;
    deleteFile: (id: string) => Promise<void>;
    uploadFile: (file: File, options?: UploadFileOptions) => Promise<TFileItem | undefined>;
    settings: Settings | undefined;
    selected: TFileItem[];
    setSelected: (files: TFileItem[]) => void;
    toggleSelected: (file: TFileItem) => void;
    hasPreviouslyUploadedFiles: boolean | null;
    setHasPreviouslyUploadedFiles: (flag: boolean) => void;
    listWhere: StateListWhere;
    setListWhere: (state: StateListWhere) => void;
    listSort: ListDbSort | undefined;
    setListSort: (state: ListDbSort) => void;
    dragging: boolean;
    setDragging: (state: boolean) => void;
    showFileDetails: (id: string) => void;
    showingFileDetails: string | null;
    loadingFileDetails: boolean;
    hideFileDetails: () => void;
    folderId?: string;
    setFolderId: (folderId?: string) => void;
    listTable: boolean;
    setListTable: (mode: boolean) => void;
}

export const FileManagerAcoViewContext = React.createContext<
    FileManagerAcoViewContextData | undefined
>(undefined);

export interface FileManagerViewProviderProps {
    accept: string[];
    tags: string[];
    scope?: string;
    own?: boolean;
    children: React.ReactNode;
}

type UploadFileOptions = Pick<UploadOptions, "onProgress">;

export const FileManagerAcoViewProvider = ({
    children,
    ...props
}: FileManagerViewProviderProps) => {
    const { identity } = useSecurity();
    const fileManager = useFileManagerApi();
    const { getRecord } = useRecords();
    const [settings, setSettings] = useState<Settings | undefined>(undefined);
    const [files, setFiles] = useState<FileItem[]>([]);
    const [listTable, setListTable] = useState<boolean>(false);

    const [state, dispatch] = React.useReducer(stateReducer, null, () =>
        initializeState({ ...props, identity })
    );

    const getFile = async (id: string) => {
        const fileInState = files.find(file => file.id === id);

        if (fileInState) {
            return fileInState;
        }

        dispatch({
            type: "loadingFileDetails",
            state: true
        });

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

        dispatch({
            type: "loadingFileDetails",
            state: false
        });

        return file;
    };

    const getSettings = async () => {
        const settings = await fileManager.getSettings();
        setSettings(settings);
    };

    useEffect(() => {
        getSettings();
    }, []);

    const setHasPreviouslyUploadedFiles: FileManagerAcoViewContextData["setHasPreviouslyUploadedFiles"] =
        state => {
            dispatch({ type: "hasPreviouslyUploadedFiles", state });
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
                folderId: state.folderId || FOLDER_ID_DEFAULT
            }
        };

        const newFile = await fileManager.createFile(data, meta);
        if (newFile) {
            newFile.tags = removeScopePrefix(newFile.tags || []);
            setFiles(files => [newFile, ...files]);

            // Sync ACO record - retrieve the most updated record from network
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

        // Sync ACO record - retrieve the most updated record from network
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
     * @param file
     * @param options
     */
    const uploadFile: FileManagerViewContextData["uploadFile"] = async (file, options = {}) => {
        const tags = props.scope ? [props.scope] : [];
        const meta = {
            location: {
                folderId: state.folderId || FOLDER_ID_DEFAULT
            }
        };

        const newFile = await fileManager.uploadFile(file, meta, {
            tags,
            onProgress: options.onProgress
        });
        if (newFile) {
            newFile.tags = removeScopePrefix(newFile.tags);
            setFiles(files => [newFile, ...files]);

            // Sync ACO record - retrieve the most updated record from network
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

    const value: FileManagerAcoViewContextData = {
        state,
        dispatch,
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
        listWhere: state.listWhere,
        setListWhere(state: StateListWhere) {
            dispatch({ type: "listWhere", state });
        },
        listSort: state.listSort,
        setListSort(state: ListDbSort) {
            dispatch({ type: "listSort", state });
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
        showingFileDetails: state.showingFileDetails,
        loadingFileDetails: state.loadingFileDetails,
        folderId: state.folderId,
        setFolderId(state = undefined) {
            dispatch({
                type: "setFolderId",
                state
            });
        },
        listTable,
        setListTable
    };

    return (
        <FileManagerAcoViewContext.Provider value={value}>
            {children}
        </FileManagerAcoViewContext.Provider>
    );
};
