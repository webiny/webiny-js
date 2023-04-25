import React, { useRef, useCallback, useState, useEffect } from "react";
import Files, { BrowseFilesParams } from "react-butterfiles";
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

const defaultFolderName = t`All files`;

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
        folderId,
        setFolderId,
        getFile,
        listTable,
        setListTable,
        listWhere,
        setListWhere,
        listSort,
        setListSort
    } = useFileManagerAcoView();

    const {
        records,
        folders,
        listTitle = defaultFolderName,
        meta,
        isListLoading,
        isListLoadingMore,
        listItems
    } = useAcoList({ type: ACO_TYPE, folderId, ...listWhere });

    const fileManager = useFileManagerApi();
    const { showSnackbar } = useSnackbar();

    const [files, setFiles] = useState<SearchRecordItem<FileItem>[]>([]);
    const [tableSorting, setTableSorting] = useState<Sorting>([]);

    const [showFoldersDialog, setFoldersDialog] = useState(false);
    const openFoldersDialog = useCallback(() => setFoldersDialog(true), []);
    const closeFoldersDialog = useCallback(() => setFoldersDialog(false), []);

    const didMount = useRef(false);

    useEffect(() => {
        const sort = tableSorting.reduce((current, next) => {
            return { ...current, [next.id]: next.desc ? "DESC" : "ASC" };
        }, {});

        setListSort(sort);
    }, [tableSorting]);

    const searchOnChange = useCallback(
        // @ts-ignore
        debounce(search => {
            if (search.length) {
                setListWhere({ search, folderId: undefined });
            } else {
                setFolderId(folderId);
                setListWhere({ search: undefined });
            }
        }, 500),
        [folderId]
    );

    useEffect(() => {
        const listSearchRecords = async () => {
            await listItems({ ...listWhere, sort: listSort });
        };

        if (didMount.current) {
            listSearchRecords();
        } else {
            didMount.current = true;
        }
    }, [JSON.stringify(listWhere), listSort]);

    const loadMoreRecords = async ({ hasMoreItems, cursor }: ListMeta) => {
        if (hasMoreItems && cursor) {
            await listItems({ ...listWhere, sort: listSort, after: cursor });
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

    const toggleTag = useCallback(async ({ tag, listWhere }) => {
        const finalTags =
            listWhere.AND && listWhere.AND[0]?.tags_in && Array.isArray(listWhere.AND[0]?.tags_in)
                ? listWhere.AND[0].tags_in
                : [];

        if (finalTags.includes(tag.name)) {
            finalTags.splice(finalTags.indexOf(tag.name), 1);
        } else {
            finalTags.push(tag.name);
        }

        setListWhere({
            ...listWhere,
            AND: finalTags.length ? [{ tags_in: finalTags }] : undefined
        });
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

    const renderList = (browseFiles: (params?: BrowseFilesParams | undefined) => void) => {
        if (!isListLoading && listWhere.search && records.length === 0) {
            return <EmptyView isSearchResult={true} browseFiles={browseFiles} />;
        }

        if (!isListLoading && records.length === 0 && folders.length === 0) {
            return <EmptyView isSearchResult={false} browseFiles={browseFiles} />;
        }

        if (listTable) {
            return (
                <Table
                    folders={!listWhere.search ? folders : []}
                    records={files}
                    loading={isListLoading}
                    onRecordClick={showFileDetails}
                    onFolderClick={id => setFolderId(id)}
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
            );
        }

        return (
            <Grid
                type={ACO_TYPE}
                folders={!listWhere.search ? folders : []}
                records={files.map(file => file.data)}
                loading={isListLoading}
                onRecordClick={showFileDetails}
                onFolderClick={id => setFolderId(id)}
                selected={selected}
                multiple={multiple}
                toggleSelected={toggleSelected}
                onChange={onChange}
                onClose={onClose}
            />
        );
    };

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
                                <FileDetails
                                    file={currentFile}
                                    onClose={hideFileDetails}
                                    scope={scope}
                                />
                            ) : null}

                            <LeftSidebar
                                title={defaultFolderName}
                                currentFolder={folderId}
                                onFolderClick={setFolderId}
                                scope={scope}
                                toggleTag={tag => toggleTag({ tag, listWhere })}
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
                                    {renderList(browseFiles)}
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
                currentParentId={folderId || null}
            />
        </>
    );
};

FileManagerAcoView.defaultProps = {
    multiple: false
};

export default FileManagerAcoView;
