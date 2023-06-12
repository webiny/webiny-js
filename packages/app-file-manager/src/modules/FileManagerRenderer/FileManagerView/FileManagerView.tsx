import React, { useCallback, useEffect, useMemo, useState } from "react";
import Files, { FilesRenderChildren, FilesRules } from "react-butterfiles";
import styled from "@emotion/styled";
import debounce from "lodash/debounce";
import { positionValues } from "react-custom-scrollbars";
// @ts-ignore
import { useHotkeys } from "react-hotkeyz";
import { observer } from "mobx-react-lite";
import { ReactComponent as UploadIcon } from "@material-design-icons/svg/filled/cloud_upload.svg";
import { ReactComponent as AddIcon } from "@material-design-icons/svg/filled/add.svg";
import { ReactComponent as GridIcon } from "@material-design-icons/svg/outlined/view_module.svg";
import { ReactComponent as TableIcon } from "@material-design-icons/svg/outlined/view_list.svg";
import { i18n } from "@webiny/app/i18n";
import { FolderDialogCreate, useNavigateFolder } from "@webiny/app-aco";
import { OverlayLayout, useSnackbar } from "@webiny/app-admin";
import { ButtonIcon, ButtonPrimary, ButtonSecondary, IconButton } from "@webiny/ui/Button";
import { Sorting } from "@webiny/ui/DataTable";
import { Scrollbar } from "@webiny/ui/Scrollbar";
import { Tooltip } from "@webiny/ui/Tooltip";
import { useFileManagerView } from "~/modules/FileManagerRenderer/FileManagerViewProvider";
import { outputFileSelectionError } from "./outputFileSelectionError";
import { LeftSidebar } from "./LeftSidebar";
import { useFileManagerApi } from "~/index";
import { FileItem } from "@webiny/app-admin/types";
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
import { TagsList } from "~/modules/FileManagerRenderer/FileManagerView/components/TagsList";
import { ListFilesSort, ListFilesSortItem } from "~/modules/FileManagerApiProvider/graphql";

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

const createSort = (sorting?: Sorting): ListFilesSort | undefined => {
    if (!sorting?.length) {
        return undefined;
    }
    return sorting.reduce<ListFilesSort>((items, item) => {
        const sort = `${item.id}_${item.desc ? "DESC" : "ASC"}` as ListFilesSortItem;
        if (items.includes(sort)) {
            return items;
        }
        items.push(sort);
        return items;
    }, []);
};

export interface FileManagerViewProps {
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

const FileManagerView: React.FC<FileManagerViewProps> = props => {
    const { onClose, onChange, accept, multiple = false, onUploadCompletion, scope, own } = props;
    const { navigateToFolder } = useNavigateFolder();
    const view = useFileManagerView();

    const setFolderId = useCallback((folderId?: string) => {
        navigateToFolder(folderId);
    }, []);

    const uploader = useMemo<BatchFileUploader>(
        () => new BatchFileUploader(view.uploadFile),
        [view.folderId]
    );

    const fileManager = useFileManagerApi();
    const { showSnackbar } = useSnackbar();

    const [tableSorting, setTableSorting] = useState<Sorting>([]);
    const [showFoldersDialog, setFoldersDialog] = useState(false);
    const openFoldersDialog = useCallback(() => setFoldersDialog(true), []);
    const closeFoldersDialog = useCallback(() => setFoldersDialog(false), []);

    useEffect(() => {
        if (!tableSorting?.length) {
            return;
        }
        const sort = createSort(tableSorting);
        if (!sort) {
            return;
        }
        view.setListSort(sort);
    }, [tableSorting]);

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

    useEffect(() => {
        view.setHasPreviouslyUploadedFiles(
            Boolean(view.files.length > 0 || view.folders.length > 0)
        );
    }, [view.files, view.folders]);

    const uploadFiles = async (files: File[]) => {
        uploader.addFiles(files);

        uploader.onUploadFinished(({ uploaded, errors }) => {
            uploader.reset();

            if (!view.hasPreviouslyUploadedFiles) {
                view.setHasPreviouslyUploadedFiles(true);
            }

            if (errors.length > 0) {
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
                return;
            }

            showSnackbar(t`File upload complete.`);

            if (typeof onUploadCompletion === "function") {
                onUploadCompletion(uploaded);
                onClose && onClose();
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
            if (view.showingFileDetails) {
                const file = await view.getFile(view.showingFileDetails);
                setCurrentFile(file);
            } else {
                setCurrentFile(undefined);
            }
        };

        // call the function
        fetchFileDetails();
    }, [view.showingFileDetails]);

    const filesBeingUploaded = uploader.getJobs().length;
    const progress = uploader.progress;

    const renderList = (browseFiles: FilesRenderChildren["browseFiles"]) => {
        if (!view.isListLoading && view.searchQuery && view.files.length === 0) {
            return <Empty isSearchResult={true} browseFiles={browseFiles} />;
        }

        if (!view.isListLoading && view.files.length === 0 && view.folders.length === 0) {
            return <Empty isSearchResult={false} browseFiles={browseFiles} />;
        }

        if (view.listTable) {
            return (
                <Table
                    folders={view.folders}
                    records={view.files}
                    loading={view.isListLoading}
                    onRecordClick={view.showFileDetails}
                    onFolderClick={setFolderId}
                    onSelectRow={rows => {
                        const files = rows
                            .filter(row => row.type === "RECORD")
                            .map(row => row.original as FileItem);
                        view.setSelected(files);
                    }}
                    sorting={tableSorting}
                    onSortingChange={setTableSorting}
                    settings={view.settings}
                    selectableItems={Boolean(typeof onChange === "function")}
                />
            );
        }

        return (
            <Grid
                folders={view.folders}
                records={view.files}
                loading={view.isListLoading}
                onRecordClick={view.showFileDetails}
                onFolderClick={setFolderId}
                selected={view.selected}
                multiple={multiple}
                toggleSelected={view.toggleSelected}
                onChange={onChange}
                onClose={onClose}
            />
        );
    };

    const loadMoreOnScroll = useCallback(
        debounce(async ({ scrollFrame }: { scrollFrame: positionValues }) => {
            if (scrollFrame.top > 0.8) {
                view.loadMoreFiles();
            }
        }, 200),
        [view.meta]
    );

    return (
        <>
            <Files
                multiple
                maxSize={view.settings ? view.settings.uploadMaxFileSize + "b" : "1TB"}
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
                        barLeft={<Title title={view.listTitle} />}
                        barMiddle={<SearchWidget />}
                        barRight={
                            <>
                                {view.selected.length > 0 ? (
                                    <ButtonPrimary
                                        flat={true}
                                        small={true}
                                        onClick={() => {
                                            (async () => {
                                                if (typeof onChange === "function") {
                                                    await onChange(
                                                        multiple ? view.selected : view.selected[0]
                                                    );

                                                    onClose && onClose();
                                                }
                                            })();
                                        }}
                                    >
                                        {t`Select`} {multiple && `(${view.selected.length})`}
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
                                        mode: view.listTable ? "Grid" : "Table"
                                    })}
                                    placement={"bottom"}
                                >
                                    <IconButton
                                        icon={view.listTable ? <GridIcon /> : <TableIcon />}
                                        onClick={() => view.setListTable(!view.listTable)}
                                    >
                                        {t`Switch`}
                                    </IconButton>
                                </Tooltip>
                            </>
                        }
                    >
                        <>
                            <FileDetails
                                loading={view.loadingFileDetails}
                                file={currentFile}
                                open={Boolean(view.showingFileDetails)}
                                onClose={view.hideFileDetails}
                                scope={scope}
                                own={own}
                            />
                            <LeftSidebar
                                title={defaultFolderName}
                                currentFolder={view.folderId}
                                onFolderClick={setFolderId}
                            >
                                <TagsList
                                    loading={view.tags.loading}
                                    activeTags={view.tags.activeTags}
                                    tags={view.tags.allTags}
                                    onActivatedTagsChange={view.tags.setActiveTags}
                                />
                            </LeftSidebar>
                            <FileListWrapper
                                {...getDropZoneProps({
                                    onDragEnter: () =>
                                        view.hasPreviouslyUploadedFiles && view.setDragging(true)
                                })}
                                data-testid={"fm-list-wrapper"}
                            >
                                {view.dragging && view.hasPreviouslyUploadedFiles && (
                                    <DropFilesHere
                                        onDragLeave={() => view.setDragging(false)}
                                        onDrop={() => view.setDragging(false)}
                                    />
                                )}
                                <Filters />
                                <Scrollbar
                                    onScrollFrame={scrollFrame => loadMoreOnScroll({ scrollFrame })}
                                >
                                    {renderList(browseFiles)}
                                </Scrollbar>
                                <BottomInfoBar accept={accept} listing={view.isListLoadingMore} />
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
                open={showFoldersDialog}
                onClose={closeFoldersDialog}
                currentParentId={view.folderId || null}
            />
        </>
    );
};

FileManagerView.defaultProps = {
    multiple: false
};

export default observer(FileManagerView);
