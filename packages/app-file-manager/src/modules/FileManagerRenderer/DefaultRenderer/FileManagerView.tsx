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
import { ButtonPrimary, ButtonIcon, IconButton } from "@webiny/ui/Button";
import { Icon } from "@webiny/ui/Icon";
import { Scrollbar } from "@webiny/ui/Scrollbar";
import { CircularProgress } from "@webiny/ui/Progress";
import { i18n } from "@webiny/app/i18n";
import { FileItem } from "@webiny/app-admin/types";
import { OverlayLayout, useSnackbar } from "@webiny/app-admin";
import FileThumbnail, { FileProps } from "./File";
import getFileTypePlugin from "~/getFileTypePlugin";
import { outputFileSelectionError } from "./outputFileSelectionError";
import DropFilesHere from "./DropFilesHere";
import { FileDetails } from "~/components/FileDetails";
import LeftSidebar from "./LeftSidebar";
import BottomInfoBar from "./BottomInfoBar";
import { useFileManagerApi, useFileManagerView } from "~/index";
import { useAcoList } from "@webiny/app-aco";
import { FOLDER_TYPE } from "~/constants/folders";
import { ListDbSort, ListMeta, SearchRecordItem } from "@webiny/app-aco/types";
import { Sorting } from "@webiny/ui/DataTable";
import { Table } from "~/modules/FileManagerRenderer/DefaultRenderer/Table";
import { Grid } from "~/modules/FileManagerRenderer/DefaultRenderer/Grid";
import { LoadMoreButton } from "~/components/LoadMoreButton";
import { Title } from "~/components/Title";
import { ReactComponent as GridIcon } from "@material-design-icons/svg/outlined/grid_view.svg";
import { ReactComponent as TableIcon } from "@material-design-icons/svg/outlined/table_rows.svg";
import { Tooltip } from "@webiny/ui/Tooltip";
import useDeepCompareEffect from "use-deep-compare-effect";

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
    height: "100%",
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

const FileList = styled("div")({
    width: "100%",
    display: "grid",
    /* define the number of grid columns */
    gridTemplateColumns: "repeat( auto-fill, minmax(220px, 1fr) )",
    marginBottom: 95
});

export interface FileManagerViewProps {
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

interface RenderFileProps extends Omit<FileProps, "children"> {
    file: FileItem;
    children?: React.ReactNode;
}
const renderFile: React.FC<RenderFileProps> = props => {
    const { file } = props;
    const plugin = getFileTypePlugin(file);
    if (!plugin) {
        return null;
    }
    return (
        <FileThumbnail {...props} key={file.id}>
            {plugin.render({
                /**
                 * TODO @ts-refactor
                 */
                // @ts-ignore
                file
            })}
        </FileThumbnail>
    );
};

interface RefreshOnScrollParams {
    loadMore: () => void;
    scrollFrame: {
        top: number;
    };
}

interface FileError {
    file: File;
    e: Error;
}

const FileManagerView: React.FC<FileManagerViewProps> = props => {
    const { onClose, onChange, accept, multiple = false, onUploadCompletion } = props;

    const {
        loadMore,
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
        queryParams,
        setQueryParams,
        hasPreviouslyUploadedFiles,
        setHasPreviouslyUploadedFiles,
        uploadFile,
        settings,
        currentFolder,
        setCurrentFolder,
        getFile,
        listTable,
        setListTable
    } = useFileManagerView();

    const {
        records,
        folders,
        listTitle = defaultFolderName,
        meta,
        isListLoading,
        isListLoadingMore,
        listItems
    } = useAcoList(FOLDER_TYPE, currentFolder);

    const [files, setFiles] = useState<SearchRecordItem<FileItem>[]>([]);

    const [tableSorting, setTableSorting] = useState<Sorting>([]);
    const [sort, setSort] = useState<ListDbSort>();

    const { innerHeight: windowHeight } = window;
    const [tableHeight, setTableHeight] = useState(0);
    const tableRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setTableHeight(tableRef?.current?.clientHeight || 0);

        return () => {
            setTableHeight(0);
        };
    });

    useEffect(() => {
        const sort = tableSorting.reduce((current, next) => {
            return { ...current, [next.id]: next.desc ? "DESC" : "ASC" };
        }, {});

        setSort(sort);
    }, [tableSorting]);

    useEffect(() => {
        const listSortedRecords = async () => {
            await listItems({ sort });
        };

        listSortedRecords();
    }, [sort]);

    const loadMoreRecords = async ({ hasMoreItems, cursor }: ListMeta) => {
        if (hasMoreItems && cursor) {
            await listItems({ after: cursor, sort });
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

    const loadMoreOnClick = useCallback(async () => {
        await loadMoreRecords(meta);
    }, [meta]);

    const fileManager = useFileManagerApi();
    const { showSnackbar } = useSnackbar();

    const searchOnChange = useCallback(
        // @ts-ignore
        debounce(search => setQueryParams({ search }), 500),
        []
    );

    const toggleTag = useCallback(async ({ tag, queryParams }) => {
        const finalTags = Array.isArray(queryParams.tags) ? [...queryParams.tags] : [];

        if (finalTags.includes(tag.name)) {
            finalTags.splice(finalTags.indexOf(tag.name), 1);
        } else {
            finalTags.push(tag.name);
        }

        setQueryParams({ ...queryParams, tags: finalTags });
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

    const refreshOnScroll = useCallback(
        debounce(({ scrollFrame, loadMore }: RefreshOnScrollParams) => {
            if (scrollFrame.top > 0.9) {
                loadMore();
            }
        }, 500),
        [loadMore]
    );

    useDeepCompareEffect(() => {
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
                <ButtonPrimary onClick={browseFiles} disabled={uploading}>
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
                        {...getDropZoneProps({
                            onDragEnter: () => hasPreviouslyUploadedFiles && setDragging(true),
                            onExited: onClose
                        })}
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
                                <Tooltip
                                    content={t`Toggle to {mode} view`({
                                        mode: listTable ? "grid" : "table"
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
                                toggleTag={tag => toggleTag({ tag, queryParams })}
                            />

                            <FileListWrapper data-testid={"fm-list-wrapper"}>
                                {/*{isListLoading && (*/}
                                {/*    <CircularProgress*/}
                                {/*        label={t`Loading Files...`}*/}
                                {/*        style={{ opacity: 1 }}*/}
                                {/*    />*/}
                                {/*)}*/}
                                {dragging && hasPreviouslyUploadedFiles && (
                                    <DropFilesHere
                                        onDragLeave={() => setDragging(false)}
                                        onDrop={() => setDragging(false)}
                                    />
                                )}
                                <Scrollbar
                                    onScrollFrame={scrollFrame => loadMoreOnScroll({ scrollFrame })}
                                >
                                    {listTable ? (
                                        <Table
                                            ref={tableRef}
                                            folders={folders}
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
                                            folders={folders}
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
                                    <LoadMoreButton
                                        show={!isListLoading && meta.hasMoreItems}
                                        disabled={isListLoadingMore}
                                        windowHeight={windowHeight}
                                        tableHeight={tableHeight}
                                        onClick={loadMoreOnClick}
                                    />
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
        </>
    );
};

FileManagerView.defaultProps = {
    multiple: false
};

export default FileManagerView;
