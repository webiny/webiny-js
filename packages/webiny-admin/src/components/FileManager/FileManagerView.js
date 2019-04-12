// @flow
/* eslint-disable */
import React, { useReducer, useRef, useCallback } from "react";
import Files from "react-butterfiles";
import { Grid, Cell } from "webiny-ui/Grid";
import { ButtonPrimary } from "webiny-ui/Button";
import { Input } from "webiny-ui/Input";
import { Form } from "webiny-form";
import { Query, Mutation } from "react-apollo";
import type { FilesRules } from "react-butterfiles";
import { listFiles, createFile } from "./graphql";
import renderFile from "./renderFile";
import { get, debounce } from "lodash";
import getFileUploader from "./getFileUploader";
import outputFileSelectionError from "./outputFileSelectionError";
import DropFilesHere from "./DropFilesHere";
import FileDetails from "./FileDetails";
import { OverlayLayout } from "webiny-admin/components/OverlayLayout";
import { withSnackbar } from "webiny-admin/components";
import { compose } from "recompose";
import { Scrollbar } from "webiny-ui/Scrollbar";
import { css } from "emotion";

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
            next.showDetails = action.file;
            break;
        }
        case "hideDetails": {
            next.showDetails = null;
            break;
        }
        case "dragging": {
            next.dragging = action.state;
            break;
        }
    }

    return next;
}

function FileManagerView(props: Props) {
    const { onClose, onChange, files, showSnackbar } = props;
    const [state, dispatch] = useReducer(fileManagerReducer, props, init);

    const { showDetails, dragging, selected, queryParams } = state;

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
                                    <Form onChange={formOnChange}>
                                        {({ Bind }) => (
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
                                                        <Input
                                                            label={"Search by filename or tags"}
                                                        />
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
                                                            Select
                                                        </ButtonPrimary>
                                                    ) : (
                                                        <ButtonPrimary onClick={browseFiles}>
                                                            Upload...
                                                        </ButtonPrimary>
                                                    )
                                                }
                                            >
                                                <>
                                                    {dragging && (
                                                        <div
                                                            {...{
                                                                onDragLeave: () => {
                                                                    dispatch({
                                                                        type: "dragging",
                                                                        state: false
                                                                    });
                                                                },
                                                                onDrop: () =>
                                                                    dispatch({
                                                                        type: "dragging",
                                                                        state: false
                                                                    })
                                                            }}
                                                            className={style.draggingFeedback}
                                                        />
                                                    )}
                                                    <FileDetails
                                                        state={state}
                                                        file={showDetails}
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
                                                        <Grid>
                                                            <Cell span={12}>
                                                                {list.length ? (
                                                                    list.map(file =>
                                                                        renderFile({
                                                                            uploadFile,
                                                                            file,
                                                                            showFileDetails: () =>
                                                                                dispatch({
                                                                                    type:
                                                                                        "showDetails",
                                                                                    file
                                                                                }),
                                                                            selected: selected.find(
                                                                                current =>
                                                                                    current.src ===
                                                                                    file.src
                                                                            ),
                                                                            onSelect: () =>
                                                                                dispatch({
                                                                                    files,
                                                                                    type:
                                                                                        "toggleSelected",
                                                                                    file
                                                                                })
                                                                        })
                                                                    )
                                                                ) : (
                                                                    <DropFilesHere />
                                                                )}
                                                            </Cell>
                                                        </Grid>
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
