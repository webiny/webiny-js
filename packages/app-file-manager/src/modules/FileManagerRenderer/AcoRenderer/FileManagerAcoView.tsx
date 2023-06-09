import React, { useRef, useCallback, useState, useEffect, useMemo } from "react";
import Files, { FilesRenderChildren, FilesRules } from "react-butterfiles";
import debounce from "lodash/debounce";
import styled from "@emotion/styled";
// @ts-ignore
import { useHotkeys } from "react-hotkeyz";
import useDeepCompareEffect from "use-deep-compare-effect";
import { observer } from "mobx-react-lite";
import { ReactComponent as UploadIcon } from "@material-design-icons/svg/filled/cloud_upload.svg";
import { ReactComponent as AddIcon } from "@material-design-icons/svg/filled/add.svg";
import { ReactComponent as GridIcon } from "@material-design-icons/svg/outlined/view_module.svg";
import { ReactComponent as TableIcon } from "@material-design-icons/svg/outlined/view_list.svg";
import { i18n } from "@webiny/app/i18n";
import { FolderDialogCreate, useAcoList } from "@webiny/app-aco";
import { OverlayLayout, useSnackbar } from "@webiny/app-admin";
import { ButtonPrimary, ButtonIcon, IconButton, ButtonSecondary } from "@webiny/ui/Button";
import { Sorting } from "@webiny/ui/DataTable";
import { Scrollbar } from "@webiny/ui/Scrollbar";
import { Tooltip } from "@webiny/ui/Tooltip";
import { useFileManagerAcoView } from "~/modules/FileManagerRenderer/FileManagerAcoViewProvider";
import { outputFileSelectionError } from "./outputFileSelectionError";
import LeftSidebar from "./LeftSidebar";
import { useFileManagerApi } from "~/index";
import { FileItem } from "@webiny/app-admin/types";
import { ListMeta, SearchRecordItem } from "@webiny/app-aco/types";
import { ACO_TYPE } from "~/constants";
import { BottomInfoBar } from "~/components/BottomInfoBar";
import { DropFilesHere } from "~/components/DropFilesHere";
import { Empty } from "~/components/Empty";
import { FileDetails } from "~/components/FileDetails";
import { Grid } from "~/components/Grid";
import { Table } from "~/components/Table";
import { Title } from "~/components/Title";
import { UploadStatus } from "~/components/UploadStatus";
import { BatchFileUploader } from "~/BatchFileUploader";
import { SearchWidget } from "./components/SearchWidget";
import { Filters } from "./components/Filters";

const t = i18n.ns("app-admin/file-manager/file-manager-view");

const FileListWrapper = styled("div")({
    float: "right",
    display: "inline-block",
    width: "calc(100vw - 270px)",
    height: "calc(100vh - 94px)",
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
    onClose?: () => void;
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

const defaultFolderName = t`All files`;

const FileManagerAcoView: React.FC<FileManagerAcoViewProps> = props => {
    const { onClose, onChange, accept, multiple = false, onUploadCompletion, scope, own } = props;

    const {
        dragging,
        setDragging,
        folderId,
        setFolderId,
        getFile,
        hasPreviouslyUploadedFiles,
        setHasPreviouslyUploadedFiles,
        hideFileDetails,
        listSort,
        loadingFileDetails,
        setListSort,
        listTable,
        setListTable,
        listWhere,
        setListWhere,
        selected,
        setSelected,
        settings,
        showFileDetails,
        showingFileDetails,
        toggleSelected,
        uploadFile
    } = useFileManagerAcoView();

    const {
        folders,
        isListLoading,
        isListLoadingMore,
        listItems,
        listTitle = defaultFolderName,
        meta,
        records
    } = useAcoList({ type: ACO_TYPE, folderId, ...listWhere });

    const uploader = useMemo<BatchFileUploader>(
        () => new BatchFileUploader(uploadFile),
        [folderId]
    );

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
        const { tag: tagName } = tag;

        const finalTags =
            listWhere.AND && listWhere.AND[0]?.tags_in && Array.isArray(listWhere.AND[0]?.tags_in)
                ? listWhere.AND[0].tags_in
                : [];

        if (finalTags.includes(tagName)) {
            finalTags.splice(finalTags.indexOf(tagName), 1);
        } else {
            finalTags.push(tagName);
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

    const uploadFiles = async (files: File[]) => {
        uploader.addFiles(files);

        uploader.onUploadFinished(({ uploaded, errors }) => {
            uploader.reset();

            if (!hasPreviouslyUploadedFiles) {
                setHasPreviouslyUploadedFiles(true);
            }

            if (errors.length > 0) {
                // We wait 750ms, just for everything to settle down a bit.
                setTimeout(() => {
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
                }, 750);

                return;
            }

            // We wait 750ms, just for everything to settle down a bit.
            setTimeout(() => showSnackbar(t`File upload complete.`), 750);

            if (typeof onUploadCompletion === "function") {
                // We wait 750ms, just for everything to settle down a bit.
                setTimeout(() => {
                    onUploadCompletion(uploaded);
                    onClose && onClose();
                }, 750);
            }
        });
    };

    const renderUploadFileAction = useCallback(
        ({ browseFiles }) => {
            if (!fileManager.canCreate) {
                return null;
            }
            return (
                <ButtonPrimary flat={true} small={true} onClick={browseFiles}>
                    <ButtonIcon icon={<UploadIcon />} />
                    {t`Upload...`}
                </ButtonPrimary>
            );
        },
        [fileManager.canCreate]
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

    const filesBeingUploaded = uploader.getJobs().length;
    const progress = uploader.progress;

    const renderList = (browseFiles: FilesRenderChildren["browseFiles"]) => {
        if (!isListLoading && listWhere.search && records.length === 0) {
            return <Empty isSearchResult={true} browseFiles={browseFiles} />;
        }

        if (!isListLoading && records.length === 0 && folders.length === 0) {
            return <Empty isSearchResult={false} browseFiles={browseFiles} />;
        }

        if (listTable) {
            return (
                <Table
                    folders={folders}
                    records={files}
                    loading={isListLoading}
                    onRecordClick={showFileDetails}
                    onFolderClick={setFolderId}
                    onSelectRow={rows => {
                        const files = rows
                            .filter(row => row.type === "RECORD")
                            .map(row => row.original as FileItem);
                        setSelected(files);
                    }}
                    sorting={tableSorting}
                    onSortingChange={setTableSorting}
                    settings={settings}
                    selectableItems={Boolean(typeof onChange === "function")}
                />
            );
        }

        return (
            <Grid
                folders={folders}
                records={files.map(file => file.data)}
                loading={isListLoading}
                onRecordClick={showFileDetails}
                onFolderClick={setFolderId}
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
                        onExited={onClose}
                        barLeft={<Title title={listTitle} />}
                        barMiddle={<SearchWidget />}
                        barRight={
                            <>
                                {selected.length > 0 ? (
                                    <ButtonPrimary
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
                            <FileDetails
                                loading={loadingFileDetails}
                                file={currentFile}
                                open={Boolean(showingFileDetails)}
                                onClose={hideFileDetails}
                                scope={scope}
                                own={own}
                            />
                            <LeftSidebar
                                title={defaultFolderName}
                                currentFolder={folderId}
                                onFolderClick={setFolderId}
                                scope={scope}
                                own={own}
                                toggleTag={tag => toggleTag({ tag, listWhere })}
                            />
                            <FileListWrapper
                                {...getDropZoneProps({
                                    onDragEnter: () =>
                                        hasPreviouslyUploadedFiles && setDragging(true)
                                })}
                                data-testid={"fm-list-wrapper"}
                            >
                                {dragging && hasPreviouslyUploadedFiles && (
                                    <DropFilesHere
                                        onDragLeave={() => setDragging(false)}
                                        onDrop={() => setDragging(false)}
                                    />
                                )}
                                <Filters />
                                <Scrollbar
                                    onScrollFrame={scrollFrame => loadMoreOnScroll({ scrollFrame })}
                                >
                                    {renderList(browseFiles)}
                                </Scrollbar>
                                <BottomInfoBar accept={accept} listing={isListLoadingMore} />
                                <UploadStatus
                                    numberOfFiles={filesBeingUploaded}
                                    progress={progress}
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

export default observer(FileManagerAcoView);
