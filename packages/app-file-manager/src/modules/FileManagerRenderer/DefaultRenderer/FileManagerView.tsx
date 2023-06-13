import React, { useRef, useCallback, useState } from "react";
import Files from "react-butterfiles";
import { observer } from "mobx-react-lite";
import { css } from "emotion";
import debounce from "lodash/debounce";
import styled from "@emotion/styled";
// @ts-ignore
import { useHotkeys } from "react-hotkeyz";
import { FilesRules } from "react-butterfiles";
import { ReactComponent as SearchIcon } from "@material-design-icons/svg/outlined/search.svg";
import { ReactComponent as UploadIcon } from "@material-design-icons/svg/filled/cloud_upload.svg";
import { ButtonPrimary, ButtonIcon } from "@webiny/ui/Button";
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
import { EmptyView } from "./EmptyView";
import UploadStatus from "~/modules/FileManagerRenderer/DefaultRenderer/BottomInfoBar/UploadStatus";
import SupportedFileTypes from "~/modules/FileManagerRenderer/DefaultRenderer/BottomInfoBar/SupportedFileTypes";
import { BatchFileUploader } from "~/BatchFileUploader";

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
        marginLeft: 50,
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
        left: 15,
        top: 7
    }
});

const FileListWrapper = styled("div")({
    float: "right",
    display: "inline-block",
    width: "calc(100vw - 270px)",
    height: "100%"
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

const FileManagerView: React.FC<FileManagerViewProps> = props => {
    const { onClose, onChange, accept, multiple = false, onUploadCompletion } = props;

    const {
        files,
        loadingFiles,
        loadMore,
        selected,
        toggleSelected,
        dragging,
        setDragging,
        showFileDetails,
        hideFileDetails,
        showingFileDetails,
        queryParams,
        setQueryParams,
        hasPreviouslyUploadedFiles,
        setHasPreviouslyUploadedFiles,
        uploadFile,
        settings
    } = useFileManagerView();

    const [uploader] = useState<BatchFileUploader>(() => new BatchFileUploader(uploadFile));
    const fileManager = useFileManagerApi();
    const { showSnackbar } = useSnackbar();

    const searchOnChange = useCallback(
        // @ts-ignore
        debounce(search => setQueryParams({ search }), 500),
        []
    );

    const toggleTag = useCallback(async ({ tag, queryParams }) => {
        const finalTags = Array.isArray(queryParams.tags) ? [...queryParams.tags] : [];

        if (finalTags.includes(tag)) {
            finalTags.splice(finalTags.indexOf(tag), 1);
        } else {
            finalTags.push(tag);
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
                <ButtonPrimary onClick={browseFiles}>
                    <ButtonIcon icon={<UploadIcon />} />
                    {t`Upload...`}
                </ButtonPrimary>
            );
        },
        [fileManager.canCreate]
    );

    const filesBeingUploaded = uploader.getJobs().length;
    const progress = uploader.progress;

    return (
        <Files
            multiple
            maxSize={settings ? settings.uploadMaxFileSize + "b" : "1TB"}
            multipleMaxSize={"1TB"}
            accept={accept}
            onSuccess={files => {
                const filesToUpload = files.map(file => file.src.file).filter(Boolean) as File[];
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
                    barLeft={
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
                        selected.length > 0 ? (
                            <ButtonPrimary
                                onClick={() => {
                                    (async () => {
                                        if (typeof onChange === "function") {
                                            await onChange(multiple ? selected : selected[0]);

                                            onClose && onClose();
                                        }
                                    })();
                                }}
                            >
                                {t`Select`} {multiple && `(${selected.length})`}
                            </ButtonPrimary>
                        ) : (
                            renderUploadFileAction({ browseFiles })
                        )
                    }
                >
                    <>
                        {dragging && hasPreviouslyUploadedFiles && (
                            <DropFilesHere
                                onDragLeave={() => setDragging(false)}
                                onDrop={() => setDragging(false)}
                            />
                        )}

                        {showingFileDetails ? (
                            <FileDetails
                                file={files.find(item => item.id === showingFileDetails)!}
                                onClose={hideFileDetails}
                                open={Boolean(showingFileDetails)}
                                loading={false} // We don't need to show the loader here
                            />
                        ) : null}

                        <LeftSidebar toggleTag={tag => toggleTag({ tag, queryParams })} />

                        <FileListWrapper data-testid={"fm-list-wrapper"}>
                            {loadingFiles && (
                                <CircularProgress
                                    label={t`Loading Files...`}
                                    style={{ opacity: 1 }}
                                />
                            )}
                            <Scrollbar
                                onScrollFrame={scrollFrame =>
                                    refreshOnScroll({ scrollFrame, loadMore })
                                }
                            >
                                <FileList>
                                    {files.length ? (
                                        files.map(file =>
                                            renderFile({
                                                file,
                                                showFileDetails: () => showFileDetails(file.id),
                                                selected: selected.some(
                                                    current => current.src === file.src
                                                ),
                                                onSelect: async () => {
                                                    if (typeof onChange === "function") {
                                                        if (multiple) {
                                                            toggleSelected(file);
                                                            return;
                                                        }

                                                        await onChange(file);
                                                        onClose && onClose();
                                                    }
                                                }
                                            })
                                        )
                                    ) : (
                                        <EmptyView browseFiles={browseFiles} />
                                    )}
                                </FileList>
                            </Scrollbar>
                            <BottomInfoBar>
                                <SupportedFileTypes accept={accept} />
                                {filesBeingUploaded > 0 && (
                                    <UploadStatus
                                        numberOfFiles={filesBeingUploaded}
                                        progress={progress}
                                    />
                                )}
                            </BottomInfoBar>
                        </FileListWrapper>
                    </>
                </OverlayLayout>
            )}
        </Files>
    );
};

FileManagerView.defaultProps = {
    multiple: false
};

export default observer(FileManagerView);
