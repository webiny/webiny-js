// @flow
/* eslint-disable */
import React, { useReducer, useRef, useCallback } from "react";
import Files from "react-butterfiles";
import { ButtonPrimary, ButtonIcon } from "webiny-ui/Button";
import { Icon } from "webiny-ui/Icon";
import File from "./File";
import { Form } from "webiny-form";
import { Query, Mutation } from "react-apollo";
import type { FilesRules } from "react-butterfiles";
import { listFiles, createFile } from "./graphql";
import getFileTypePlugin from "./getFileTypePlugin";
import { get, debounce } from "lodash";
import getFileUploader from "./getFileUploader";
import outputFileSelectionError from "./outputFileSelectionError";
import DropFilesHere from "./DropFilesHere";
import NoResults from "./NoResults";
import FileDetails from "./FileDetails";
import { OverlayLayout } from "webiny-admin/components/OverlayLayout";
import { withSnackbar } from "webiny-admin/components";
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
    })
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
    files: FilesRules
};

function init(props) {
    return {
        selected: [],
        queryParams: {
            types: get(props, "files.accept"),
            perPage: 50,
            sort: { createdOn: -1 }
        }
    };
}

function fileManagerReducer(state, action) {
    const next = { ...state };
    switch (action.type) {
        case "toggleSelected": {
            if (!action.files.multiple) {
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

function FileManagerView(props: Props) {
    const { onClose, onChange, files, showSnackbar } = props;
    const [state, dispatch] = useReducer(fileManagerReducer, props, init);
    const { showDetailsFileSrc, dragging, selected, queryParams } = state;

    const gqlQuery = useRef();

    const formOnChange = useCallback(
        debounce(queryParams => {
            dispatch({ type: "queryParams", queryParams });
        }, 500),
        []
    );

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

    const updateCacheAfterCreateFile = useCallback((cache, newFile) => {
        const newFileData = get(newFile, "data.files.createFile.data");

        const data = cache.readQuery({ query: listFiles, variables: queryParams });
        data.files.listFiles.data.unshift(newFileData);

        cache.writeQuery({
            query: listFiles,
            variables: queryParams,
            data
        });
    }, []);

    const getFileDetailsFile = useCallback(function getFileDetailsFile({ src, list }) {
        return list.find(item => item.src === src);
    }, []);

    useHotkeys({
        zIndex: 1,
        keys: {
            esc: onClose
        }
    });

    return (
        <Mutation mutation={createFile} update={updateCacheAfterCreateFile}>
            {createFile => (
                <Query query={listFiles} variables={queryParams} ref={gqlQuery}>
                    {({ data, fetchMore }) => {
                        const list = get(data, "files.listFiles.data") || [];
                        const uploadFile = async files => {
                            // TODO: snackbar se ne vidi (z-index issue?)
                            showSnackbar("File upload started...");

                            const list = Array.isArray(files) ? files : [files];
                            await Promise.all(
                                list.map(async file => {
                                    const response = await getFileUploader()(file);
                                    await createFile({ variables: { data: response } });
                                })
                            );

                            showSnackbar("File upload completed.");
                        };

                        return (
                            <Files
                                {...files}
                                multipleMaxCount={10}
                                onSuccess={files => uploadFile(files.map(file => file.src.file))}
                                onError={errors => {
                                    const message = outputFileSelectionError(errors);
                                    showSnackbar(message);
                                }}
                            >
                                {({ getDropZoneProps, browseFiles }) => (
                                    <Form onChange={formOnChange} data={{ search: "" }}>
                                        {({ data: formData, Bind }) => (
                                            <OverlayLayout
                                                {...getDropZoneProps({
                                                    onDragEnter: () =>
                                                        dispatch({
                                                            type: "dragging",
                                                            state: true
                                                        })
                                                })}
                                                barLeft={
                                                    <Bind name={"search"}>
                                                        {({ value, onChange }) => (
                                                            <InputSearch>
                                                                <Icon
                                                                    className={searchIcon}
                                                                    icon={<SearchIcon />}
                                                                />
                                                                <input
                                                                    onChange={e =>
                                                                        onChange(e.target.value)
                                                                    }
                                                                    value={value}
                                                                    placeholder={
                                                                        "Search by filename or tags"
                                                                    }
                                                                />
                                                            </InputSearch>
                                                        )}
                                                    </Bind>
                                                }
                                                onExited={onClose}
                                                barRight={
                                                    selected.length > 0 ? (
                                                        <ButtonPrimary
                                                            onClick={async () => {
                                                                await onChange(
                                                                    files.multiple
                                                                        ? selected
                                                                        : selected[0]
                                                                );

                                                                onClose();
                                                            }}
                                                        >
                                                            Select{" "}
                                                            {files.multiple &&
                                                                `(${selected.length})`}
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
                                                    {dragging && (
                                                        <DropFilesHere
                                                            className={style.draggingFeedback}
                                                            onDragLeave={() => {
                                                                dispatch({
                                                                    type: "dragging",
                                                                    state: false
                                                                });
                                                            }}
                                                            onDrop={() =>
                                                                dispatch({
                                                                    type: "dragging",
                                                                    state: false
                                                                })
                                                            }
                                                        />
                                                    )}
                                                    <FileDetails
                                                        state={state}
                                                        file={getFileDetailsFile({
                                                            list,
                                                            src: showDetailsFileSrc
                                                        })}
                                                        uploadFile={uploadFile}
                                                        onClose={() =>
                                                            dispatch({ type: "hideDetails" })
                                                        }
                                                    />

                                                    <Scrollbar
                                                        onScrollFrame={scrollFrame =>
                                                            refreshOnScroll({
                                                                scrollFrame,
                                                                fetchMore
                                                            })
                                                        }
                                                    >
                                                        <FileList>
                                                            {list.length ? (
                                                                list.map((file, index) =>
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
                                                                            if (files.multiple) {
                                                                                return dispatch({
                                                                                    files,
                                                                                    type:
                                                                                        "toggleSelected",
                                                                                    file
                                                                                });
                                                                            }

                                                                            await onChange(file);
                                                                            onClose();
                                                                        }
                                                                    })
                                                                )
                                                            ) : formData.search ? (
                                                                <NoResults />
                                                            ) : (
                                                                <DropFilesHere />
                                                            )}
                                                        </FileList>
                                                    </Scrollbar>
                                                </>
                                            </OverlayLayout>
                                        )}
                                    </Form>
                                )}
                            </Files>
                        );
                    }}
                </Query>
            )}
        </Mutation>
    );
}

export default compose(withSnackbar())(FileManagerView);
