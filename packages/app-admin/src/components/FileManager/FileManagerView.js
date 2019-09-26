// @flow
import React, { useRef, useCallback } from "react";
import Files from "react-butterfiles";
import { ButtonPrimary, ButtonIcon } from "@webiny/ui/Button";
import { Icon } from "@webiny/ui/Icon";
import File from "./File";
import { Query, Mutation } from "react-apollo";
import type { FilesRules } from "react-butterfiles";
import { LIST_FILES, CREATE_FILE } from "./graphql";
import getFileTypePlugin from "./getFileTypePlugin";
import { get, debounce, cloneDeep } from "lodash";
import getFileUploader from "./getFileUploader";
import outputFileSelectionError from "./outputFileSelectionError";
import DropFilesHere from "./DropFilesHere";
import NoResults from "./NoResults";
import FileDetails from "./FileDetails";
import LeftSidebar from "./LeftSidebar";
import BottomInfoBar from "./BottomInfoBar";
import { OverlayLayout } from "@webiny/app-admin/components/OverlayLayout";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { Scrollbar } from "@webiny/ui/Scrollbar";
import { css } from "emotion";
import styled from "@emotion/styled";
import { useHotkeys } from "react-hotkeyz";
import { useFileManager } from "./FileManagerContext";

import { ReactComponent as SearchIcon } from "./icons/round-search-24px.svg";
import { ReactComponent as UploadIcon } from "./icons/round-cloud_upload-24px.svg";

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
            fontWeight: "600",
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

type Props = {
    onChange: Function,
    onClose: Function,
    files: FilesRules,
    multiple: boolean, // Does not affect <Files> component, it always allows multiple selection.
    accept: Array<string>,
    maxSize: number,
    multipleMaxCount: number,
    multipleMaxSize: number
};

function renderFile(props) {
    const { file } = props;
    const plugin = getFileTypePlugin(file);
    return (
        <File {...props} key={file.src}>
            {plugin.render({ file })}
        </File>
    );
}

const renderEmpty = ({ hasPreviouslyUploadedFiles, browseFiles }) => {
    if (hasPreviouslyUploadedFiles) {
        return <NoResults />;
    }
    return <DropFilesHere empty onClick={browseFiles} />;
};

function FileManagerView(props: Props) {
    const {
        onClose,
        onChange,
        accept,
        multiple,
        maxSize,
        multipleMaxCount,
        multipleMaxSize
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

    const gqlQuery = useRef();

    const searchOnChange = useCallback(debounce(search => setQueryParams({ search }), 500), []);

    const toggleTag = useCallback(async ({ tag, queryParams }) => {
        const finalTags = Array.isArray(queryParams.tags) ? [...queryParams.tags] : [];

        if (finalTags.includes(tag)) {
            finalTags.splice(finalTags.indexOf(tag), 1);
        } else {
            finalTags.push(tag);
        }

        setQueryParams({ ...queryParams, tags: finalTags });
    }, []);

    const refreshOnScroll = useCallback(
        debounce(({ scrollFrame, fetchMore }) => {
            if (scrollFrame.top > 0.9) {
                if (!gqlQuery.current) {
                    return;
                }
                const { data } = gqlQuery.current.getQueryResult();
                const nextPage = get(data, "files.listFiles.meta.nextPage");
                nextPage &&
                    fetchMore({
                        variables: { page: nextPage },
                        updateQuery: (prev, { fetchMoreResult }) => {
                            if (!fetchMoreResult) {
                                return prev;
                            }

                            const next = { ...fetchMoreResult };

                            next.files.listFiles.data = [
                                ...prev.files.listFiles.data,
                                ...fetchMoreResult.files.listFiles.data
                            ];

                            return next;
                        }
                    });
            }
        }, 500),
        []
    );

    const updateCacheAfterCreateFile = (cache, newFile) => {
        const newFileData = get(newFile, "data.files.createFile.data");

        const data = cloneDeep(cache.readQuery({ query: LIST_FILES, variables: queryParams }));
        data.files.listFiles.data.unshift(newFileData);

        cache.writeQuery({
            query: LIST_FILES,
            variables: queryParams,
            data
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

    return (
        <Mutation mutation={CREATE_FILE} update={updateCacheAfterCreateFile}>
            {createFile => (
                <Query
                    query={LIST_FILES}
                    variables={queryParams}
                    ref={gqlQuery}
                    onCompleted={response => {
                        const list = get(response, "files.listFiles.data") || [];
                        if (hasPreviouslyUploadedFiles === null) {
                            setHasPreviouslyUploadedFiles(list.length > 0);
                        }
                    }}
                >
                    {({ data, fetchMore }) => {
                        const list = get(data, "files.listFiles.data") || [];
                        const uploadFile = async files => {
                            setUploading(true);
                            const list = Array.isArray(files) ? files : [files];

                            await Promise.all(
                                list.map(async file => {
                                    const response = await getFileUploader()(file);
                                    await createFile({ variables: { data: response } });
                                })
                            );

                            if (!hasPreviouslyUploadedFiles) {
                                setHasPreviouslyUploadedFiles(true);
                            }

                            setUploading(false);

                            // We wait 750ms, just for everything to settle down a bit.
                            setTimeout(() => showSnackbar("File upload complete."), 750);
                        };

                        return (
                            <Files
                                multiple // Always allow multiple selection.
                                maxSize={maxSize}
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
                                            onDragEnter: () =>
                                                hasPreviouslyUploadedFiles && setDragging(true),
                                            onExited: onClose
                                        })}
                                        barLeft={
                                            <InputSearch>
                                                <Icon
                                                    className={searchIcon}
                                                    icon={<SearchIcon />}
                                                />
                                                <input
                                                    ref={searchInput}
                                                    onChange={e => searchOnChange(e.target.value)}
                                                    placeholder={"Search by filename or tags"}
                                                />
                                            </InputSearch>
                                        }
                                        barRight={
                                            selected.length > 0 ? (
                                                <ButtonPrimary
                                                    onClick={async () => {
                                                        await onChange(
                                                            multiple ? selected : selected[0]
                                                        );

                                                        onClose();
                                                    }}
                                                >
                                                    Select {multiple && `(${selected.length})`}
                                                </ButtonPrimary>
                                            ) : (
                                                <ButtonPrimary onClick={browseFiles}>
                                                    <ButtonIcon icon={<UploadIcon />} />
                                                    Upload...
                                                </ButtonPrimary>
                                            )
                                        }
                                    >
                                        <>
                                            {dragging && hasPreviouslyUploadedFiles && (
                                                <DropFilesHere
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
                                            />

                                            <LeftSidebar
                                                queryParams={queryParams}
                                                toggleTag={tag => toggleTag({ tag, queryParams })}
                                            />

                                            <FileListWrapper>
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
                                                                      showFileDetails: () =>
                                                                          showFileDetails(file.src),
                                                                      selected: selected.find(
                                                                          current =>
                                                                              current.src ===
                                                                              file.src
                                                                      ),
                                                                      onSelect: async () => {
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
                                                                  browseFiles
                                                              })}
                                                    </FileList>
                                                </Scrollbar>
                                                <BottomInfoBar
                                                    accept={accept}
                                                    uploading={uploading}
                                                />
                                            </FileListWrapper>
                                        </>
                                    </OverlayLayout>
                                )}
                            </Files>
                        );
                    }}
                </Query>
            )}
        </Mutation>
    );
}

FileManagerView.defaultProps = {
    multiple: false,
    maxSize: "10mb",
    multipleMaxSize: "100mb",
    multipleMaxCount: 100
};

export default FileManagerView;
