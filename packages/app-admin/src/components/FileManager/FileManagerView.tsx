import React, { useRef, useCallback, useMemo } from "react";
import { css } from "emotion";
import styled from "@emotion/styled";
import Files from "react-butterfiles";
import { ButtonPrimary, ButtonIcon } from "@webiny/ui/Button";
import { Icon } from "@webiny/ui/Icon";
import File from "./File";
import { useQuery, useMutation, useApolloClient } from "@apollo/react-hooks";
import { FilesRules } from "react-butterfiles";
import { LIST_FILES, CREATE_FILE, GET_FILE_SETTINGS } from "./graphql";
import getFileTypePlugin from "./getFileTypePlugin";
import get from "lodash/get";
import debounce from "lodash/debounce";
import getFileUploader from "./getFileUploader";
import outputFileSelectionError from "./outputFileSelectionError";
import DropFilesHere from "./DropFilesHere";
import NoResults from "./NoResults";
import FileDetails from "./FileDetails";
import LeftSidebar from "./LeftSidebar";
import BottomInfoBar from "./BottomInfoBar";
import { OverlayLayout } from "../OverlayLayout";
import { useSnackbar } from "../../hooks/useSnackbar";
import { Scrollbar } from "@webiny/ui/Scrollbar";
import { CircularProgress } from "@webiny/ui/Progress";
import { i18n } from "@webiny/app/i18n";
import { useSecurity } from "@webiny/app-security";
import { useHotkeys } from "react-hotkeyz";
import { useFileManager } from "./FileManagerContext";
import { ReactComponent as SearchIcon } from "./icons/round-search-24px.svg";
import { ReactComponent as UploadIcon } from "./icons/round-cloud_upload-24px.svg";
import NoPermissionView from "./NoPermissionView";

const t = i18n.ns("app-admin/file-manager/file-manager-view");

const style = {
    draggingFeedback: css({
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        opacity: 0.5,
        background: "white",
        zIndex: 100
    }),
    leftDrawer: {
        header: css({
            textAlign: "center",
            fontSize: 18,
            padding: 10,
            fontWeight: 600,
            color: "var(--mdc-theme-on-surface)"
        })
    }
};

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

type FileManagerViewProps = {
    onChange: Function;
    onClose: Function;
    files?: FilesRules;
    multiple: boolean; // Does not affect <Files> component, it always allows multiple selection.
    accept: Array<string>;
    maxSize: number | string;
    multipleMaxCount: number;
    multipleMaxSize: number | string;
    onUploadCompletion?: Function;
};

function renderFile(props) {
    const { file } = props;
    const plugin = getFileTypePlugin(file);
    return (
        <File {...props} key={file.id}>
            {plugin.render({ file })}
        </File>
    );
}

const renderEmpty = ({ hasPreviouslyUploadedFiles, browseFiles, fmFilePermission }) => {
    if (!fmFilePermission) {
        return <NoPermissionView />;
    }
    if (hasPreviouslyUploadedFiles) {
        return <NoResults />;
    }
    return <DropFilesHere empty onClick={browseFiles} />;
};

function FileManagerView(props: FileManagerViewProps) {
    const {
        onClose,
        onChange,
        accept,
        multiple,
        maxSize,
        multipleMaxCount,
        multipleMaxSize,
        onUploadCompletion
    } = props;

    const {
        selected,
        toggleSelected,
        dragging,
        setDragging,
        uploading,
        setUploading,
        showFileDetails,
        showingFileDetails,
        queryParams,
        setQueryParams,
        hasPreviouslyUploadedFiles,
        setHasPreviouslyUploadedFiles
    } = useFileManager();
    const { showSnackbar } = useSnackbar();

    const { identity } = useSecurity();
    const fmFilePermission = useMemo(() => identity.getPermission("fm.file"), []);
    const canCreate = useMemo(() => {
        // Bail out early if no access
        if (!fmFilePermission) {
            return false;
        }

        if (fmFilePermission.own) {
            return true;
        }

        if (typeof fmFilePermission.rwd === "string") {
            return fmFilePermission.rwd.includes("w");
        }

        return true;
    }, [fmFilePermission]);
    const canEdit = useCallback(
        item => {
            // Bail out early if no access
            if (!fmFilePermission) {
                return false;
            }
            const creatorId = get(item, "createdBy.id");

            if (fmFilePermission.own && creatorId) {
                const identityId = identity.id || identity.login;
                return creatorId === identityId;
            }

            if (typeof fmFilePermission.rwd === "string") {
                return fmFilePermission.rwd.includes("w");
            }

            return true;
        },
        [fmFilePermission]
    );

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

    const updateCacheAfterCreateFile = (cache, newFile) => {
        const newFileData = get(newFile, "data.fileManager.createFile.data");

        const data = cache.readQuery({ query: LIST_FILES, variables: queryParams });

        cache.writeQuery({
            query: LIST_FILES,
            variables: queryParams,
            data: {
                fileManager: {
                    ...data.fileManager,
                    listFiles: {
                        ...data.fileManager.listFiles,
                        data: [newFileData, ...(data.fileManager.listFiles.data || [])]
                    }
                }
            }
        });
    };

    const getFileDetailsFile = useCallback(function getFileDetailsFile({ src, list }) {
        return list.find(item => item.src === src);
    }, []);

    useHotkeys({
        zIndex: 50,
        keys: {
            esc: onClose
        }
    });

    const searchInput = useRef();

    const apolloClient = useApolloClient();

    const gqlQuery = useQuery(LIST_FILES, {
        variables: queryParams,
        onCompleted: response => {
            const list = get(response, "fileManager.listFiles.data") || [];
            if (hasPreviouslyUploadedFiles === null) {
                setHasPreviouslyUploadedFiles(list.length > 0);
            }
        }
    });

    const refreshOnScroll = useCallback(
        debounce(({ scrollFrame, fetchMore }) => {
            if (scrollFrame.top > 0.9) {
                const cursor = get(gqlQuery.data, "fileManager.listFiles.meta.cursor");
                if (cursor) {
                    fetchMore({
                        variables: { after: cursor },
                        updateQuery: (prev, { fetchMoreResult }) => {
                            if (!fetchMoreResult) {
                                return prev;
                            }

                            const next = { ...fetchMoreResult };

                            next.fileManager.listFiles.data = [
                                ...prev.fileManager.listFiles.data,
                                ...fetchMoreResult.fileManager.listFiles.data
                            ];

                            return next;
                        }
                    });
                }
            }
        }, 500),
        [gqlQuery]
    );

    const { data, fetchMore, loading } = gqlQuery;

    const list = get(data, "fileManager.listFiles.data") || [];
    const [createFile] = useMutation(CREATE_FILE, { update: updateCacheAfterCreateFile });
    const uploadFile = async files => {
        setUploading(true);
        const list = Array.isArray(files) ? files : [files];

        const errors = [];
        const uploadedFiles = [];
        await Promise.all(
            list.map(async file => {
                try {
                    const response = await getFileUploader()(file, { apolloClient });
                    const createFileResponse = await createFile({ variables: { data: response } });
                    // Save create file data for later
                    uploadedFiles.push(get(createFileResponse, "data.fileManager.createFile.data"));
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
            }, 750);
        }

        // We wait 750ms, just for everything to settle down a bit.
        setTimeout(() => showSnackbar(t`File upload complete.`), 750);
        if (typeof onUploadCompletion === "function") {
            // We wait 750ms, just for everything to settle down a bit.
            setTimeout(() => {
                onUploadCompletion(uploadedFiles);
                onClose();
            }, 750);
        }
    };

    const renderUploadFileAction = useCallback(
        ({ browseFiles }) => {
            if (!canCreate) {
                return null;
            }
            return (
                <ButtonPrimary onClick={browseFiles} disabled={uploading}>
                    <ButtonIcon icon={<UploadIcon />} />
                    {t`Upload...`}
                </ButtonPrimary>
            );
        },
        [uploading, canCreate]
    );

    const settingsQuery = useQuery(GET_FILE_SETTINGS);
    const settings = get(settingsQuery.data, "fileManager.getSettings.data") || {};
    return (
        <Files
            multiple
            maxSize={settings.uploadMaxFileSize ? settings.uploadMaxFileSize + "b" : maxSize}
            multipleMaxSize={multipleMaxSize}
            multipleMaxCount={multipleMaxCount}
            accept={accept}
            onSuccess={files => uploadFile(files.map(file => file.src.file))}
            onError={errors => {
                const message = outputFileSelectionError(errors);
                showSnackbar(message);
            }}
        >
            {({ getDropZoneProps, browseFiles, validateFiles }) => (
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
                                disabled={!fmFilePermission}
                                data-testid={"file-manager.search-input"}
                            />
                        </InputSearch>
                    }
                    barRight={
                        selected.length > 0 ? (
                            <ButtonPrimary
                                disabled={uploading}
                                onClick={async () => {
                                    await onChange(multiple ? selected : selected[0]);

                                    onClose();
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
                                // @ts-ignore TODO: @adrian - className is never rendered?!
                                className={style.draggingFeedback}
                                onDragLeave={() => setDragging(false)}
                                onDrop={() => setDragging(false)}
                            />
                        )}

                        <FileDetails
                            validateFiles={validateFiles}
                            uploadFile={uploadFile}
                            file={getFileDetailsFile({
                                list,
                                src: showingFileDetails
                            })}
                            canEdit={canEdit}
                        />

                        <LeftSidebar
                            queryParams={queryParams}
                            toggleTag={tag => toggleTag({ tag, queryParams })}
                        />

                        <FileListWrapper data-testid={"fm-list-wrapper"}>
                            {loading && (
                                <CircularProgress
                                    label={t`Loading Files...`}
                                    style={{ opacity: 1 }}
                                />
                            )}
                            <Scrollbar
                                onScrollFrame={scrollFrame =>
                                    refreshOnScroll({
                                        scrollFrame,
                                        fetchMore
                                    })
                                }
                            >
                                <FileList>
                                    {list.length
                                        ? list.map(file =>
                                              renderFile({
                                                  uploadFile,
                                                  file,
                                                  showFileDetails: () => showFileDetails(file.src),
                                                  selected: selected.find(
                                                      current => current.src === file.src
                                                  ),
                                                  onSelect:
                                                      typeof onChange === "undefined"
                                                          ? undefined
                                                          : async () => {
                                                                if (multiple) {
                                                                    toggleSelected(file);
                                                                    return;
                                                                }

                                                                await onChange(file);
                                                                onClose();
                                                            }
                                              })
                                          )
                                        : renderEmpty({
                                              hasPreviouslyUploadedFiles,
                                              browseFiles,
                                              fmFilePermission
                                          })}
                                </FileList>
                            </Scrollbar>
                            <BottomInfoBar accept={accept} uploading={uploading} />
                        </FileListWrapper>
                    </>
                </OverlayLayout>
            )}
        </Files>
    );
}

FileManagerView.defaultProps = {
    multiple: false,
    maxSize: "1000mb",
    multipleMaxSize: "1000mb",
    multipleMaxCount: 100
};

export default FileManagerView;
