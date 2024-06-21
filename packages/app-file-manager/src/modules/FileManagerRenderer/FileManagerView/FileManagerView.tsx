import React, { useCallback, useEffect, useMemo, useState } from "react";
import Files, { FilesRenderChildren } from "react-butterfiles";
import styled from "@emotion/styled";
import debounce from "lodash/debounce";
import omit from "lodash/omit";
import { positionValues } from "react-custom-scrollbars";
// @ts-expect-error
import { useHotkeys } from "react-hotkeyz";
import { observer } from "mobx-react-lite";
import { ReactComponent as UploadIcon } from "@material-design-icons/svg/filled/cloud_upload.svg";
import { ReactComponent as AddIcon } from "@material-design-icons/svg/filled/add.svg";
import { i18n } from "@webiny/app/i18n";
import { useCreateDialog } from "@webiny/app-aco";
import { OverlayLayout, useSnackbar } from "@webiny/app-admin";
import {
    generateAutoSaveId,
    LeftPanel,
    RightPanel,
    SplitView
} from "@webiny/app-admin/components/SplitView";
import { useI18N } from "@webiny/app-i18n";
import { useTenancy } from "@webiny/app-tenancy";
import { ButtonIcon, ButtonPrimary, ButtonProps, ButtonSecondary } from "@webiny/ui/Button";
import { Sorting } from "@webiny/ui/DataTable";
import { Scrollbar } from "@webiny/ui/Scrollbar";
import { useFileManagerView } from "~/modules/FileManagerRenderer/FileManagerViewProvider";
import { outputFileSelectionError } from "./outputFileSelectionError";
import { LeftSidebar } from "./LeftSidebar";
import { useFileManagerApi, useFileManagerViewConfig } from "~/index";
import { FileItem } from "@webiny/app-admin/types";
import { BottomInfoBar } from "~/components/BottomInfoBar";
import { BulkActions } from "~/components/BulkActions";
import { DropFilesHere } from "~/components/DropFilesHere";
import { Empty } from "~/components/Empty";
import { FileDetails } from "~/components/FileDetails";
import { Grid } from "~/components/Grid";
import { LayoutSwitch } from "~/components/LayoutSwitch";
import { Table, TableProps } from "~/components/Table";
import { Title } from "~/components/Title";
import { UploadStatus } from "~/components/UploadStatus";
import { BatchFileUploader } from "~/BatchFileUploader";
import { SearchWidget } from "./components/SearchWidget";
import { Filters } from "./components/Filters";
import { TagsList } from "~/modules/FileManagerRenderer/FileManagerView/components/TagsList";
import { ListFilesSort, ListFilesSortItem } from "~/modules/FileManagerApiProvider/graphql";
import { TableItem } from "~/types";

const t = i18n.ns("app-admin/file-manager/file-manager-view");

const FileListWrapper = styled("div")({
    zIndex: 60,
    height: "calc(100vh - 94px)",
    ".mdc-data-table": {
        display: "inline-table"
    }
});

type BrowseFilesHandler = {
    browseFiles: FilesRenderChildren["browseFiles"];
};

type GetFileUploadErrorMessageProps =
    | string
    | {
          message: string;
      };

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

const FileManagerView = () => {
    const view = useFileManagerView();
    const fileManager = useFileManagerApi();
    const { browser } = useFileManagerViewConfig();
    const { showSnackbar } = useSnackbar();
    const { showDialog: showCreateFolderDialog } = useCreateDialog();
    const { tenant } = useTenancy();
    const { getCurrentLocale } = useI18N();
    const [drawerLoading, setDrawerLoading] = useState<string | null>(null);

    const uploader = useMemo<BatchFileUploader>(
        () => new BatchFileUploader(view.uploadFile),
        [view.folderId]
    );

    const [tableSorting, setTableSorting] = useState<Sorting>([]);
    const [currentFile, setCurrentFile] = useState<FileItem>();

    useEffect(() => {
        const fetchFileDetails = async () => {
            if (view.showingFileDetails) {
                setDrawerLoading("Loading file details...");
                const file = await view.getFile(view.showingFileDetails);
                setCurrentFile(file);
            } else {
                setCurrentFile(undefined);
            }
            setDrawerLoading(null);
        };

        // call the function
        fetchFileDetails();
    }, [view.showingFileDetails]);

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

    const getFileUploadErrorMessage = useCallback((e: GetFileUploadErrorMessageProps) => {
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
            esc: view.onClose
        }
    });

    const uploadFiles = async (files: File[]) => {
        uploader.addFiles(files);

        uploader.onUploadFinished(({ uploaded, errors }) => {
            uploader.reset();

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

            view.onUploadCompletion(uploaded);
        });
    };

    const renderUploadFileAction = useCallback(
        ({ browseFiles }: BrowseFilesHandler) => {
            if (!fileManager.canCreate) {
                return null;
            }
            return (
                <ButtonPrimary
                    flat={true}
                    small={true}
                    onClick={browseFiles as ButtonProps["onClick"]}
                >
                    <ButtonIcon icon={<UploadIcon />} />
                    {t`Upload...`}
                </ButtonPrimary>
            );
        },
        [fileManager.canCreate]
    );

    const filesBeingUploaded = uploader.getJobs().length;
    const progress = uploader.progress;

    const renderList = (browseFiles: FilesRenderChildren["browseFiles"]) => {
        if (!view.isListLoading && view.isSearch && view.files.length === 0) {
            return <Empty isSearchResult={true} browseFiles={browseFiles} />;
        }

        if (!view.isListLoading && view.files.length === 0 && view.folders.length === 0) {
            return <Empty isSearchResult={false} browseFiles={browseFiles} />;
        }

        if (view.listTable) {
            const getSelectableRow = (rows: TableItem[]) =>
                rows
                    .filter(row => row.$type === "RECORD")
                    .map(row => omit(row, ["$type", "$selectable"]) as FileItem);

            const onSelectRow: TableProps["onSelectRow"] = view.hasOnSelectCallback
                ? rows => {
                      const files = getSelectableRow(rows);

                      if (view.multiple) {
                          view.setSelected(files);
                      } else {
                          view.onChange(files[0]);
                      }
                  }
                : rows => {
                      const files = getSelectableRow(rows);
                      view.setSelected(files);
                  };

            const onToggleRow: TableProps["onToggleRow"] = view.hasOnSelectCallback
                ? row => {
                      const files = getSelectableRow([row]);

                      if (view.multiple) {
                          view.toggleSelected(files[0]);
                      } else {
                          view.onChange(files[0]);
                      }
                  }
                : row => {
                      const files = getSelectableRow([row]);
                      view.toggleSelected(files[0]);
                  };

            return (
                <Table
                    onSelectRow={onSelectRow}
                    onToggleRow={onToggleRow}
                    sorting={tableSorting}
                    onSortingChange={setTableSorting}
                />
            );
        }

        return (
            <Grid
                folders={view.folders}
                records={view.files}
                loading={view.isListLoading}
                onFolderClick={view.setFolderId}
                selected={view.selected}
                multiple={view.multiple}
                toggleSelected={view.toggleSelected}
                deselectAll={view.deselectAll}
                onChange={view.onChange}
                onClose={view.onClose}
                hasOnSelectCallback={view.hasOnSelectCallback}
            />
        );
    };

    const loadMoreOnScroll = useCallback(
        debounce(async ({ scrollFrame }: { scrollFrame: positionValues }) => {
            if (scrollFrame.top > 0.8) {
                view.loadMoreFiles();
            }
        }, 200),
        [view.meta, view.loadMoreFiles]
    );

    const onCreateFolder = useCallback(() => {
        showCreateFolderDialog({ currentParentId: view.folderId });
    }, [view.folderId]);

    const updateFile = useCallback(
        async (data: FileItem) => {
            const { id, ...fileData } = data;
            setDrawerLoading("Saving file changes...");
            await view.updateFile(id, fileData);
            setDrawerLoading(null);
            showSnackbar("File updated successfully!");
            view.hideFileDetails();
        },
        [view.updateFile]
    );

    const autoSaveId = useMemo(() => {
        const localeCode = getCurrentLocale("content");
        const applicationId = "fm:file";
        return generateAutoSaveId(tenant, localeCode, applicationId);
    }, [getCurrentLocale, tenant]);

    return (
        <>
            <Files
                multiple
                maxSize={view.settings ? view.settings.uploadMaxFileSize + "b" : "1TB"}
                multipleMaxSize={"1TB"}
                accept={view.accept}
                onSuccess={files => {
                    const filesToUpload = files
                        .map(file => file.src.file)
                        .filter(Boolean) as File[];
                    uploadFiles(filesToUpload);
                }}
                onError={errors => {
                    const message = outputFileSelectionError(errors);
                    showSnackbar(message);
                }}
            >
                {({ getDropZoneProps, browseFiles }) => (
                    <OverlayLayout
                        onExited={view.onClose}
                        barLeft={<Title title={view.listTitle} />}
                        barMiddle={<SearchWidget />}
                        barRight={
                            <>
                                {view.hasOnSelectCallback && view.selected.length > 0 ? (
                                    <ButtonPrimary
                                        flat={true}
                                        small={true}
                                        onClick={() => view.onChange(view.selected)}
                                    >
                                        {t`Select`} {view.multiple && `(${view.selected.length})`}
                                    </ButtonPrimary>
                                ) : (
                                    renderUploadFileAction({ browseFiles } as BrowseFilesHandler)
                                )}
                                <ButtonSecondary
                                    data-testid={"file-manager.create-folder-button"}
                                    onClick={onCreateFolder}
                                    small={true}
                                    style={{ margin: "0 8px" }}
                                >
                                    <ButtonIcon icon={<AddIcon />} />
                                    {t`New Folder`}
                                </ButtonSecondary>
                                <LayoutSwitch />
                            </>
                        }
                    >
                        <>
                            <FileDetails
                                loading={drawerLoading}
                                file={currentFile}
                                open={Boolean(view.showingFileDetails)}
                                onClose={view.hideFileDetails}
                                onSave={updateFile}
                            />
                            <SplitView autoSaveId={autoSaveId}>
                                <LeftPanel span={2}>
                                    <LeftSidebar
                                        currentFolder={view.folderId}
                                        onFolderClick={view.setFolderId}
                                    >
                                        {browser.filterByTags ? (
                                            <TagsList
                                                loading={view.tags.loading}
                                                activeTags={view.tags.activeTags}
                                                tags={view.tags.allTags}
                                                onActivatedTagsChange={view.tags.setActiveTags}
                                            />
                                        ) : null}
                                    </LeftSidebar>
                                </LeftPanel>
                                <RightPanel span={10}>
                                    <FileListWrapper
                                        {...getDropZoneProps({
                                            onDragOver: () => view.setDragging(true),
                                            onDragLeave: () => view.setDragging(false),
                                            onDrop: () => view.setDragging(false)
                                        })}
                                        data-testid={"fm-list-wrapper"}
                                    >
                                        {view.dragging && <DropFilesHere />}
                                        <BulkActions />
                                        <Filters />
                                        <Scrollbar
                                            onScrollFrame={scrollFrame =>
                                                loadMoreOnScroll({ scrollFrame })
                                            }
                                        >
                                            {renderList(browseFiles)}
                                        </Scrollbar>
                                        <BottomInfoBar
                                            accept={view.accept}
                                            listing={view.isListLoadingMore}
                                        />
                                        <UploadStatus
                                            numberOfFiles={filesBeingUploaded}
                                            progress={progress}
                                        />
                                    </FileListWrapper>
                                </RightPanel>
                            </SplitView>
                        </>
                    </OverlayLayout>
                )}
            </Files>
        </>
    );
};

export default observer(FileManagerView);
