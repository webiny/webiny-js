import React, { useRef, useCallback, useState, useEffect } from "react";
import Files from "react-butterfiles";
import { css } from "emotion";
import debounce from "lodash/debounce";
import styled from "@emotion/styled";
// @ts-ignore
import { useHotkeys } from "react-hotkeyz";
import { FilesRules } from "react-butterfiles";
import { ReactComponent as SearchIcon } from "@material-design-icons/svg/outlined/search.svg";
import { ReactComponent as UploadIcon } from "@material-design-icons/svg/filled/cloud_upload.svg";
import { ReactComponent as AddIcon } from "@material-design-icons/svg/filled/add.svg";
import { ReactComponent as GridIcon } from "@material-design-icons/svg/outlined/view_module.svg";
import { ReactComponent as TableIcon } from "@material-design-icons/svg/outlined/view_list.svg";
import { ButtonPrimary, ButtonIcon, IconButton, ButtonSecondary } from "@webiny/ui/Button";
import { Icon } from "@webiny/ui/Icon";
import { Scrollbar } from "@webiny/ui/Scrollbar";

import { i18n } from "@webiny/app/i18n";
import { FileItem } from "@webiny/app-admin/types";
import { OverlayLayout, useSnackbar } from "@webiny/app-admin";
import { outputFileSelectionError } from "./outputFileSelectionError";
import DropFilesHere from "./DropFilesHere";
import { FileDetails } from "~/components/FileDetails";
import LeftSidebar from "./LeftSidebar";
import BottomInfoBar from "./BottomInfoBar";
import { useFileManagerApi } from "~/index";
import { FolderDialogCreate, useAcoList } from "@webiny/app-aco";
import { ListMeta, SearchRecordItem } from "@webiny/app-aco/types";
import { Sorting } from "@webiny/ui/DataTable";
import { Table } from "~/modules/FileManagerRenderer/AcoRenderer/Table";
import { Grid } from "~/modules/FileManagerRenderer/AcoRenderer/Grid";
import { Title } from "~/components/Title";

import { Tooltip } from "@webiny/ui/Tooltip";
import useDeepCompareEffect from "use-deep-compare-effect";
import { EmptyView } from "~/modules/FileManagerRenderer/AcoRenderer/EmptyView";
import { ACO_TYPE } from "~/constants";
import { useFileManagerAcoView } from "~/modules/FileManagerRenderer/FileManagerAcoViewProvider";

const t = i18n.ns("app-admin/file-manager/file-manager-view");

const defaultFolderName = t`All files`;

const InputSearch = styled("div")({
    backgroundColor: "var(--mdc-theme-on-background)",
    position: "relative",
    height: 32,
    padding: 3,
    width: "100%",
    borderRadius: 2,
    "> input": {
        border: "none",
        fontSize: 14,
        width: "calc(100% - 10px)",
        height: "100%",
        marginLeft: 32,
        backgroundColor: "transparent",
        outline: "none",
        color: "var(--mdc-theme-text-primary-on-background)"
    }
});

const searchIcon = css({
    "&.mdc-button__icon": {
        color: "var(--mdc-theme-text-secondary-on-background)",
        position: "absolute",
        width: 24,
        height: 24,
        left: 8,
        top: 8
    }
});

const FileListWrapper = styled("div")({
    float: "right",
    display: "inline-block",
    width: "calc(100vw - 270px)",
    height: "calc(100vh - 64px)",
    position: "relative",
    ".mdc-data-table": {
        display: "inline-table"
    },
    ".mdc-data-table__cell": {
        width: "250px",
        maxWidth: "250px",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis"
    }
});

export interface FileManagerAcoViewProps {
    onChange?: Function;
    onClose?: Function;
    files?: FilesRules;
    multiple?: boolean; // Does not affect <Files> component, it always allows multiple selection.
    accept: Array<string>;
    maxSize?: number | string;
    multipleMaxCount?: number;
    multipleMaxSize?: number | string;
    onUploadCompletion?: Function;
    tags?: string[];
    scope?: string;
    own?: boolean;
}

interface FileError {
    file: File;
    e: Error;
}

const DEFAULT_SCOPE = "scope:";
export const getInitialWhere = (scope: string | undefined) => {
    if (!scope) {
        return {
            tags_not_startsWith: DEFAULT_SCOPE
        };
    }
    return {
        tags_startsWith: scope
    };
};

const FileManagerAcoView: React.FC<FileManagerAcoViewProps> = props => {
    const { onClose, onChange, accept, multiple = false, onUploadCompletion, scope } = props;

    const {
        selected,
        setSelected,
        toggleSelected,
        dragging,
        setDragging,
        uploading,
        setUploading,
        showFileDetails,
        hideFileDetails,
        showingFileDetails,
        hasPreviouslyUploadedFiles,
        setHasPreviouslyUploadedFiles,
        uploadFile,
        settings,
        currentFolder,
        setCurrentFolder,
        getFile,
        listTable,
        setListTable,
        listParams,
        setListParams
    } = useFileManagerAcoView();

    const initialWhere = getInitialWhere(scope);

    const {
        records,
        folders,
        listTitle = defaultFolderName,
        meta,
        isListLoading,
        isListLoadingMore,
        listItems
    } = useAcoList({ type: ACO_TYPE, folderId: currentFolder, ...initialWhere });

    const fileManager = useFileManagerApi();
    const { showSnackbar } = useSnackbar();

    const [files, setFiles] = useState<SearchRecordItem<FileItem>[]>([]);
    const [tableSorting, setTableSorting] = useState<Sorting>([]);

    const [showFoldersDialog, setFoldersDialog] = useState(false);
    const openFoldersDialog = useCallback(() => setFoldersDialog(true), []);
    const closeFoldersDialog = useCallback(() => setFoldersDialog(false), []);

    useEffect(() => {
        const sort = tableSorting.reduce((current, next) => {
            return { ...current, [next.id]: next.desc ? "DESC" : "ASC" };
        }, {});

        setListParams({ sort });
    }, [tableSorting]);

    const searchOnChange = useCallback(
        // @ts-ignore
        debounce(search => setListParams({ search, folderId: undefined }), 500),
        []
    );

    useEffect(() => {
        const listSearchRecords = async () => {
            await listItems({ ...listParams });
        };

        listSearchRecords();
    }, [JSON.stringify(listParams)]);

    const loadMoreRecords = async ({ hasMoreItems, cursor }: ListMeta) => {
        if (hasMoreItems && cursor) {
            await listItems({ ...listParams, after: cursor });
        }
    };

    const loadMoreOnScroll = useCallback(
        debounce(async ({ scrollFrame }) => {
            if (scrollFrame.top > 0.8) {
                await loadMoreRecords(meta);
            }
        }, 200),
        [meta]
    );

    const toggleTag = useCallback(async ({ tag, listParams }) => {
        const finalTags =
            listParams.tags_in && Array.isArray(listParams.tags_in) ? [...listParams.tags_in] : [];

        if (finalTags.includes(tag.name)) {
            finalTags.splice(finalTags.indexOf(tag.name), 1);
        } else {
            finalTags.push(tag.name);
        }

        setListParams({ ...listParams, tags_in: finalTags });
    }, []);

    const getFileUploadErrorMessage = useCallback(e => {
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
        zIndex: 50,
        keys: {
            esc: onClose
        }
    });

    const searchInput = useRef<HTMLInputElement>(null);

    useDeepCompareEffect(() => {
        if (!settings) {
            return;
        }

        const recordsFile = records.map(file => {
            const src = settings?.srcPrefix + file.data.key;
            return {
                ...file,
                data: {
                    ...file.data,
                    src
                }
            };
        });

        setFiles(recordsFile as SearchRecordItem<FileItem>[]);
    }, [{ ...records }, settings]);

    useDeepCompareEffect(() => {
        setHasPreviouslyUploadedFiles(Boolean(records.length > 0 || folders.length > 0));
    }, [{ ...records }, { ...folders }]);

    const uploadFiles = async (files: File | File[]): Promise<number | null> => {
        setUploading(true);
        const list: File[] = Array.isArray(files) ? files : [files];

        const errors: FileError[] = [];
        const uploadedFiles: FileItem[] = [];
        await Promise.all(
            list.map(async file => {
                try {
                    const newFile = await uploadFile(file);

                    if (newFile) {
                        uploadedFiles.push(newFile);
                    }
                } catch (e) {
                    errors.push({ file, e });
                }
            })
        );

        if (!hasPreviouslyUploadedFiles) {
            setHasPreviouslyUploadedFiles(true);
        }

        setUploading(false);

        if (errors.length > 0) {
            // We wait 750ms, just for everything to settle down a bit.
            return setTimeout(() => {
                showSnackbar(
                    <>
                        {t`One or more files were not uploaded successfully:`}
                        <ol>
                            {errors.map(({ file, e }) => (
                                <li key={file.name}>
                                    <strong>{file.name}</strong>: {getFileUploadErrorMessage(e)}
                                </li>
                            ))}
                        </ol>
                    </>
                );
                // TODO @ts-refactor
            }, 750) as unknown as number;
        }

        // We wait 750ms, just for everything to settle down a bit.
        setTimeout(() => showSnackbar(t`File upload complete.`), 750);
        if (typeof onUploadCompletion === "function") {
            // We wait 750ms, just for everything to settle down a bit.
            return setTimeout(() => {
                onUploadCompletion(uploadedFiles);
                onClose && onClose();
                // TODO @ts-refactor
            }, 750) as unknown as number;
        }
        return null;
    };

    const renderUploadFileAction = useCallback(
        ({ browseFiles }) => {
            if (!fileManager.canCreate) {
                return null;
            }
            return (
                <ButtonPrimary flat={true} small={true} onClick={browseFiles} disabled={uploading}>
                    <ButtonIcon icon={<UploadIcon />} />
                    {t`Upload...`}
                </ButtonPrimary>
            );
        },
        [uploading, fileManager.canCreate]
    );

    const [currentFile, setCurrentFile] = useState<FileItem>();
    useEffect(() => {
        const fetchFileDetails = async () => {
            if (showingFileDetails) {
                const file = await getFile(showingFileDetails);
                setCurrentFile(file);
            } else {
                setCurrentFile(undefined);
            }
        };

        // call the function
        fetchFileDetails();
    }, [showingFileDetails]);

    return (
        <>
            <Files
                multiple
                maxSize={settings ? settings.uploadMaxFileSize + "b" : "1TB"}
                multipleMaxSize={"1TB"}
                accept={accept}
                onSuccess={files => {
                    const filesToUpload = files
                        .map(file => file.src.file)
                        .filter(Boolean) as File[];
                    uploadFiles(filesToUpload);
                }}
                onError={errors => {
                    console.log("onError", errors);
                    const message = outputFileSelectionError(errors);
                    showSnackbar(message);
                }}
            >
                {({ getDropZoneProps, browseFiles }) => (
                    <OverlayLayout
                        barLeft={<Title title={listTitle} />}
                        barMiddle={
                            <InputSearch>
                                <Icon className={searchIcon} icon={<SearchIcon />} />
                                <input
                                    ref={searchInput}
                                    onChange={e => searchOnChange(e.target.value)}
                                    placeholder={t`Search by filename or tags`}
                                    disabled={!fileManager.canRead}
                                    data-testid={"file-manager.search-input"}
                                />
                            </InputSearch>
                        }
                        barRight={
                            <>
                                {selected.length > 0 ? (
                                    <ButtonPrimary
                                        disabled={uploading}
                                        flat={true}
                                        small={true}
                                        onClick={() => {
                                            (async () => {
                                                if (typeof onChange === "function") {
                                                    await onChange(
                                                        multiple ? selected : selected[0]
                                                    );

                                                    onClose && onClose();
                                                }
                                            })();
                                        }}
                                    >
                                        {t`Select`} {multiple && `(${selected.length})`}
                                    </ButtonPrimary>
                                ) : (
                                    renderUploadFileAction({ browseFiles })
                                )}
                                <ButtonSecondary
                                    data-testid={"file-manager.create-folder-button"}
                                    onClick={openFoldersDialog}
                                    small={true}
                                    style={{ margin: "0 8px" }}
                                >
                                    <ButtonIcon icon={<AddIcon />} />
                                    {t`New Folder`}
                                </ButtonSecondary>
                                <Tooltip
                                    content={t`{mode} layout`({
                                        mode: listTable ? "Grid" : "Table"
                                    })}
                                    placement={"bottom"}
                                >
                                    <IconButton
                                        icon={listTable ? <GridIcon /> : <TableIcon />}
                                        onClick={() => setListTable(!listTable)}
                                    >
                                        {t`Switch`}
                                    </IconButton>
                                </Tooltip>
                            </>
                        }
                    >
                        <>
                            {currentFile ? (
                                <FileDetails file={currentFile} onClose={hideFileDetails} />
                            ) : null}

                            <LeftSidebar
                                title={defaultFolderName}
                                currentFolder={currentFolder}
                                onFolderClick={setCurrentFolder}
                                scope={scope}
                                toggleTag={tag => toggleTag({ tag, listParams })}
                            />

                            <FileListWrapper
                                {...getDropZoneProps({
                                    onDragEnter: () =>
                                        hasPreviouslyUploadedFiles && setDragging(true),
                                    onExited: onClose
                                })}
                                data-testid={"fm-list-wrapper"}
                            >
                                {dragging && hasPreviouslyUploadedFiles && (
                                    <DropFilesHere
                                        onDragLeave={() => setDragging(false)}
                                        onDrop={() => setDragging(false)}
                                    />
                                )}
                                <Scrollbar
                                    onScrollFrame={scrollFrame => loadMoreOnScroll({ scrollFrame })}
                                >
                                    {records.length === 0 &&
                                    folders.length === 0 &&
                                    !isListLoading ? (
                                        <EmptyView
                                            isSearchResult={!listParams.search}
                                            browseFiles={browseFiles}
                                        />
                                    ) : listTable ? (
                                        <Table
                                            folders={!listParams.search ? folders : []}
                                            records={files}
                                            loading={isListLoading}
                                            onRecordClick={showFileDetails}
                                            onFolderClick={id => setCurrentFolder(id)}
                                            onSelectRow={rows => {
                                                const files = rows
                                                    .filter(row => row.type === "RECORD")
                                                    .map(row => row.original as FileItem);
                                                setSelected(files);
                                            }}
                                            sorting={tableSorting}
                                            onSortingChange={setTableSorting}
                                            settings={settings}
                                        />
                                    ) : (
                                        <Grid
                                            type={ACO_TYPE}
                                            folders={!listParams.search ? folders : []}
                                            records={files.map(file => file.data)}
                                            loading={isListLoading}
                                            onRecordClick={showFileDetails}
                                            onFolderClick={id => setCurrentFolder(id)}
                                            selected={selected}
                                            multiple={multiple}
                                            toggleSelected={toggleSelected}
                                            onChange={onChange}
                                            onClose={onClose}
                                        />
                                    )}
                                </Scrollbar>
                                <BottomInfoBar
                                    accept={accept}
                                    uploading={uploading}
                                    listing={isListLoadingMore}
                                />
                            </FileListWrapper>
                        </>
                    </OverlayLayout>
                )}
            </Files>
            <FolderDialogCreate
                type={ACO_TYPE}
                open={showFoldersDialog}
                onClose={closeFoldersDialog}
                currentParentId={currentFolder || null}
            />
        </>
    );
};

FileManagerAcoView.defaultProps = {
    multiple: false
};

export default FileManagerAcoView;
