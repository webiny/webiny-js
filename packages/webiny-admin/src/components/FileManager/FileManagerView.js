// @flow
/* eslint-disable */
import React, { useReducer, useRef, useCallback } from "react";
import Files from "react-butterfiles";
import { ButtonPrimary, ButtonIcon } from "webiny-ui/Button";
import { Icon } from "webiny-ui/Icon";
import File from "./File";
import { Query, Mutation } from "react-apollo";
import type { FilesRules } from "react-butterfiles";
import { listFiles, createFile } from "./graphql";
import getFileTypePlugin from "./getFileTypePlugin";
import { get, debounce, cloneDeep } from "lodash";
import getFileUploader from "./getFileUploader";
import outputFileSelectionError from "./outputFileSelectionError";
import DropFilesHere from "./DropFilesHere";
import NoResults from "./NoResults";
import FileDetails from "./FileDetails";
import LeftSidebar from "./LeftSidebar";
import { OverlayLayout } from "webiny-admin/components/OverlayLayout";
import { withSnackbar, type WithSnackbarProps } from "webiny-admin/components";
import { compose } from "recompose";
import { Scrollbar } from "webiny-ui/Scrollbar";
import { css } from "emotion";
import styled from "react-emotion";
import { useHotkeys } from "react-hotkeyz";

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
    marginBottom: 75
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

function init({ accept }) {
    return {
        selected: [],
        hasPreviouslyUploadedFiles: null,
        queryParams: {
            types: accept,
            perPage: 50,
            sort: { createdOn: -1 }
        }
    };
}

function fileManagerReducer(state, action) {
    const next = { ...state };
    switch (action.type) {
        case "toggleSelected": {
            if (!action.multiple) {
                next.selected = [];
            }
            const existingIndex = state.selected.findIndex(item => item.src === action.file.src);
            if (existingIndex < 0) {
                next.selected.push(action.file);
            } else {
                next.selected.splice(existingIndex, 1);
            }
            break;
        }
        case "queryParams": {
            next.selected = [];
            next.queryParams = {
                ...state.queryParams,
                ...action.queryParams,
                types: state.queryParams.types,
                perPage: 40,
                sort: { createdOn: -1 }
            };
            break;
        }

        case "showDetails": {
            next.showDetailsFileSrc = action.file;
            break;
        }
        case "hideDetails": {
            next.showDetailsFileSrc = null;
            break;
        }
        case "dragging": {
            next.dragging = action.state;
            break;
        }
        case "noPreviouslyUploadedFiles": {
            next.hasPreviouslyUploadedFiles = false;
            break;
        }
        case "hasPreviouslyUploadedFiles": {
            next.hasPreviouslyUploadedFiles = true;
            break;
        }
    }

    return next;
}

function renderFile(props) {
    const { file } = props;
    const plugin = getFileTypePlugin(file);
    return (
        <File {...props} key={file.src}>
            {plugin.render({ file })}
        </File>
    );
}

const renderEmpty = ({ state: { hasPreviouslyUploadedFiles }, browseFiles }) => {
    if (hasPreviouslyUploadedFiles) {
        return <NoResults />;
    }
    return <DropFilesHere empty onClick={browseFiles} />;
};

function FileManagerView(props: WithSnackbarProps & Props) {
    const {
        onClose,
        onChange,
        accept,
        multiple,
        showSnackbar,
        hideSnackbar,
        maxSize,
        multipleMaxCount,
        multipleMaxSize
    } = props;
    const [state, dispatch] = useReducer(fileManagerReducer, props, init);
    const {
        showDetailsFileSrc,
        dragging,
        selected,
        queryParams,
        hasPreviouslyUploadedFiles
    } = state;

    const gqlQuery = useRef();

    const searchOnChange = useCallback(
        debounce(search => dispatch({ type: "queryParams", queryParams: { search } }), 500),
        []
    );

    const toggleTag = useCallback(async ({ tag, queryParams }) => {
        const finalTags = Array.isArray(queryParams.tags) ? [...queryParams.tags] : [];

        if (finalTags.includes(tag)) {
            finalTags.splice(finalTags.indexOf(tag), 1);
        } else {
            finalTags.push(tag);
        }

        dispatch({ type: "queryParams", queryParams: { ...queryParams, tags: finalTags } });
    }, []);

    const refreshOnScroll = useCallback(
        debounce(({ scrollFrame, fetchMore }) => {
            if (scrollFrame.top > 0.9) {
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

        const data = cloneDeep(cache.readQuery({ query: listFiles, variables: queryParams }));
        data.files.listFiles.data.unshift(newFileData);

        cache.writeQuery({
            query: listFiles,
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
        <Mutation mutation={createFile} update={updateCacheAfterCreateFile}>
            {createFile => (
                <Query
                    query={listFiles}
                    variables={queryParams}
                    ref={gqlQuery}
                    onCompleted={response => {
                        const list = get(response, "files.listFiles.data") || [];

                        if (hasPreviouslyUploadedFiles === null) {
                            const type =
                                list.length > 0
                                    ? "hasPreviouslyUploadedFiles"
                                    : "noPreviouslyUploadedFiles";
                            dispatch({ type });
                        }
                    }}
                >
                    {({ data, fetchMore }) => {
                        const list = get(data, "files.listFiles.data") || [];
                        const uploadFile = async files => {
                            showSnackbar("File upload started...", { timeout: 1200 });

                            const list = Array.isArray(files) ? files : [files];
                            await Promise.all(
                                list.map(async file => {
                                    const response = await getFileUploader()(file);
                                    await createFile({ variables: { data: response } });
                                })
                            );

                            if (!hasPreviouslyUploadedFiles) {
                                dispatch({ type: "hasPreviouslyUploadedFiles" });
                            }

                            hideSnackbar();
                            setTimeout(() => {
                                showSnackbar("File upload completed.", { timeout: 2000 });
                            }, 1500);
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
                                                hasPreviouslyUploadedFiles &&
                                                dispatch({
                                                    type: "dragging",
                                                    state: true
                                                })
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
                                        onExited={onClose}
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
                                                    onDragLeave={() => {
                                                        dispatch({
                                                            type: "dragging",
                                                            state: false
                                                        });
                                                    }}
                                                    onDrop={() => {
                                                        dispatch({
                                                            type: "dragging",
                                                            state: false
                                                        });
                                                    }}
                                                />
                                            )}

                                            <FileDetails
                                                state={state}
                                                validateFiles={validateFiles}
                                                file={getFileDetailsFile({
                                                    list,
                                                    src: showDetailsFileSrc
                                                })}
                                                uploadFile={uploadFile}
                                                onClose={() =>
                                                    dispatch({
                                                        type: "hideDetails"
                                                    })
                                                }
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
                                                                          dispatch({
                                                                              type: "showDetails",
                                                                              file: file.src
                                                                          }),
                                                                      selected: selected.find(
                                                                          current =>
                                                                              current.src ===
                                                                              file.src
                                                                      ),
                                                                      onSelect: async () => {
                                                                          if (multiple) {
                                                                              dispatch({
                                                                                  multiple,
                                                                                  type:
                                                                                      "toggleSelected",
                                                                                  file
                                                                              });
                                                                              return;
                                                                          }

                                                                          await onChange(file);
                                                                          onClose();
                                                                      }
                                                                  })
                                                              )
                                                            : renderEmpty({ state, browseFiles })}
                                                    </FileList>
                                                </Scrollbar>
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
    multipleMaxSize: "10mb",
    multipleMaxCount: 10
};

export default compose(withSnackbar())(FileManagerView);
