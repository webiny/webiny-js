import React, { useRef, useCallback, useMemo } from "react";
import { css } from "emotion";
import styled from "@emotion/styled";
import Files, { FilesRenderChildren } from "react-butterfiles";
import { ButtonPrimary, ButtonIcon } from "@webiny/ui/Button";
import { Icon } from "@webiny/ui/Icon";
import File, { FileProps } from "./File";
import { useQuery, useMutation, useApolloClient } from "@apollo/react-hooks";
import { FilesRules } from "react-butterfiles";
import {
    LIST_FILES,
    CREATE_FILE,
    GET_FILE_SETTINGS,
    CreateFileMutationVariables,
    CreateFileMutationResponse,
    ListFilesQueryResponse,
    ListFilesQueryVariables
} from "./graphql";
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
import { useSnackbar } from "~/hooks/useSnackbar";
import { Scrollbar } from "@webiny/ui/Scrollbar";
import { CircularProgress } from "@webiny/ui/Progress";
import { i18n } from "@webiny/app/i18n";
import { useSecurity } from "@webiny/app-security";
/**
 * Package react-hotkeyz is missing types.
 */
// @ts-ignore
import { useHotkeys } from "react-hotkeyz";
import { useFileManager } from "./FileManagerContext";
import { ReactComponent as SearchIcon } from "./icons/round-search-24px.svg";
import { ReactComponent as UploadIcon } from "./icons/round-cloud_upload-24px.svg";
import NoPermissionView from "./NoPermissionView";
import { FileItem, FileManagerSecurityPermission } from "~/components/FileManager/types";
import { MutationUpdaterFn } from "apollo-client/core/watchQueryOptions";
import { SecurityPermission } from "@webiny/app-security/types";
import { ObservableQueryFields } from "@apollo/react-common/lib/types/types";

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

export interface FileManagerViewProps {
    onChange?: Function;
    onClose?: Function;
    files?: FilesRules;
    multiple: boolean; // Does not affect <Files> component, it always allows multiple selection.
    accept: Array<string>;
    maxSize: number | string;
    multipleMaxCount: number;
    multipleMaxSize: number | string;
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
        <File {...props} key={file.id}>
            {plugin.render({
                /**
                 * TODO @ts-refactor
                 */
                // @ts-ignore
                file
            })}
        </File>
    );
};
interface RenderEmptyProps {
    hasPreviouslyUploadedFiles: boolean;
    browseFiles: FilesRenderChildren["browseFiles"];
    fmFilePermission: SecurityPermission | null;
}
const renderEmpty: React.FC<RenderEmptyProps> = ({
    hasPreviouslyUploadedFiles,
    browseFiles,
    fmFilePermission
}) => {
    if (!fmFilePermission) {
        return <NoPermissionView />;
    }
    if (hasPreviouslyUploadedFiles) {
        return <NoResults />;
    }
    return <DropFilesHere empty onClick={() => browseFiles()} />;
};

interface RefreshOnScrollParams {
    fetchMore: ObservableQueryFields<ListFilesQueryResponse, ListFilesQueryVariables>["fetchMore"];
    scrollFrame: {
        top: number;
    };
}

interface FileError {
    file: FileItem;
    e: Error;
}

interface GetFileDetailsFileParams {
    src: string;
    list: FileItem[];
}

const FileManagerView: React.FC<FileManagerViewProps> = props => {
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

    const { identity, getPermission } = useSecurity();
    const fmFilePermission = useMemo((): FileManagerSecurityPermission | null => {
        return getPermission<FileManagerSecurityPermission>("fm.file");
    }, [identity]);
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
                const identityId = identity ? identity.id || identity.login : null;
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

    const updateCacheAfterCreateFile: MutationUpdaterFn<CreateFileMutationResponse> = (
        cache,
        newFile
    ) => {
        const newFileData = get(newFile, "data.fileManager.createFile.data");

        const data = cache.readQuery<ListFilesQueryResponse>({
            query: LIST_FILES,
            variables: queryParams
        });

        cache.writeQuery({
            query: LIST_FILES,
            variables: queryParams,
            data: {
                fileManager: {
                    ...(data?.fileManager || {}),
                    listFiles: {
                        ...(data?.fileManager || {}).listFiles,
                        data: [newFileData, ...((data?.fileManager?.listFiles || {}).data || [])]
                    }
                }
            }
        });
    };

    const getFileDetailsFile = useCallback(({ src, list }: GetFileDetailsFileParams): FileItem => {
        return list.find(item => item.src === src) as FileItem;
    }, []);

    useHotkeys({
        zIndex: 50,
        keys: {
            esc: onClose
        }
    });

    const searchInput = useRef<HTMLInputElement>(null);

    const apolloClient = useApolloClient();

    const gqlQuery = useQuery<ListFilesQueryResponse, ListFilesQueryVariables>(LIST_FILES, {
        variables: queryParams,
        onCompleted: response => {
            const list = get(response, "fileManager.listFiles.data") || [];
            if (hasPreviouslyUploadedFiles === null) {
                setHasPreviouslyUploadedFiles(list.length > 0);
            }
        }
    });

    const refreshOnScroll = useCallback(
        debounce(({ scrollFrame, fetchMore }: RefreshOnScrollParams) => {
            if (scrollFrame.top > 0.9) {
                const cursor = get(gqlQuery.data, "fileManager.listFiles.meta.cursor");
                if (cursor) {
                    fetchMore({
                        variables: { after: cursor },
                        updateQuery: (
                            prev: ListFilesQueryResponse,
                            result: { fetchMoreResult?: ListFilesQueryResponse }
                        ) => {
                            const { fetchMoreResult } = result;
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

    const list: FileItem[] = get(data, "fileManager.listFiles.data") || [];
    const [createFile] = useMutation<CreateFileMutationResponse, CreateFileMutationVariables>(
        CREATE_FILE,
        {
            update: updateCacheAfterCreateFile
        }
    );
    const uploadFile = async (files: FileItem[] | FileItem): Promise<number | null> => {
        setUploading(true);
        const list: FileItem[] = Array.isArray(files) ? files : [files];

        const errors: FileError[] = [];
        const uploadedFiles: FileItem[] = [];
        await Promise.all(
            list.map(async file => {
                try {
                    const response = await getFileUploader()(file, { apolloClient });
                    /**
                     * Add "tags" while creating the new file.
                     */
                    const createFileResponse = await createFile({
                        variables: {
                            data: {
                                ...response,
                                tags: queryParams.scope ? [queryParams.scope] : []
                            }
                        }
                    });
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
            onSuccess={files => {
                uploadFile(files.map(file => file.src.file as FileItem).filter(Boolean));
            }}
            onError={errors => {
                /**
                 * TODO @ts-refactor
                 * Figure out if incoming errors var is wrong or the one in the outputFileSelectionError
                 */
                // @ts-ignore
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
                                                      (current: FileItem) =>
                                                          current.src === file.src
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
};

FileManagerView.defaultProps = {
    multiple: false,
    maxSize: "1000mb",
    multipleMaxSize: "1000mb",
    multipleMaxCount: 100
};

export default FileManagerView;
