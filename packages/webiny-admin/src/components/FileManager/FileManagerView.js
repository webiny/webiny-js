// @flow
/* eslint-disable */
import React, { useReducer, useRef } from "react";
import Files from "react-butterfiles";
import { Grid, Cell } from "webiny-ui/Grid";
import { ButtonPrimary } from "webiny-ui/Button";
import { Input } from "webiny-ui/Input";
import { Form } from "webiny-form";
import { Query } from "react-apollo";
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
import { graphql } from "react-apollo";
import { Scrollbar } from "webiny-ui/Scrollbar";

type Props = {
    onChange: Function,
    onClose: Function,
    selection: FilesRules
};

function init(props) {
    return {
        selected: [],
        queryParams: {
            types: props.selection.accept,
            perPage: 40
        }
    };
}

function fileManagerReducer(state, action) {
    const next = { ...state };
    switch (action.type) {
        case "toggleSelected": {
            if (!action.selection.multiple) {
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
                ...action.queryParams,
                types: state.queryParams.types,
                perPage: 40,
                page: 1
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
    }

    return next;
}

function FileManagerView(props: Props) {
    const { onClose, onChange, selection, gqlCreateFile, showSnackbar } = props;
    const [{ showDetails, selected, queryParams }, dispatch] = useReducer(
        fileManagerReducer,
        props,
        init
    );

    const gqlQuery = useRef();

    const formOnChange = debounce(queryParams => {
        dispatch({ type: "queryParams", queryParams });
    }, 500);

    const refreshOnScroll = debounce(({ scrollFrame, fetchMore }) => {
        if (scrollFrame.top > 0.9) {
            const { data } = gqlQuery.current.getQueryResult();
            const nextPage = get(data, "files.listFiles.meta.nextPage");
            nextPage &&
                fetchMore({
                    variables: { page: nextPage },
                    updateQuery: (prev, { fetchMoreResult }) => {
                        console.log(prev);
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
    }, 500);

    return (
        <Query query={listFiles} variables={queryParams} ref={gqlQuery}>
            {({ data, refetch, fetchMore }) => {
                const list = get(data, "files.listFiles.data") || [];
                const uploadFile = async files => {
                    // TODO: snackbar se ne vidi (z-index issue?)
                    showSnackbar("File upload started...");

                    const list = Array.isArray(files) ? files : [files];
                    await Promise.all(
                        list.map(async file => {
                            const response = await getFileUploader()(file);
                            await gqlCreateFile({ variables: { data: response } });
                        })
                    );

                    showSnackbar("File upload completed.");
                    await refetch();
                };

                return (
                    <Files
                        {...selection}
                        multipleMaxCount={10}
                        onSuccess={files => uploadFile(files.map(file => file.src.file))}
                        onError={errors => {
                            const message = outputFileSelectionError(errors);
                            console.log(message); // TODO: remove this once snackbars are visible
                            showSnackbar(message);
                        }}
                    >
                        {({ getDropZoneProps, browseFiles }) => (
                            <div {...getDropZoneProps()}>
                                <Form onChange={formOnChange}>
                                    {({ Bind }) => (
                                        <OverlayLayout
                                            barLeft={
                                                <Bind name={"search"}>
                                                    <Input label={"Search by filename or tags"} />
                                                </Bind>
                                            }
                                            onExited={onClose}
                                            barRight={
                                                selected.length > 0 ? (
                                                    <ButtonPrimary
                                                        onClick={async () => {
                                                            await onChange(
                                                                selection.multiple
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
                                                <FileDetails
                                                    refreshFileList={refetch}
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
                                                                        onClick: () =>
                                                                            dispatch({
                                                                                type: "showDetails",
                                                                                file
                                                                            }),
                                                                        selected: selected.find(
                                                                            current =>
                                                                                current.src ===
                                                                                file.src
                                                                        ),
                                                                        onSelect: () =>
                                                                            dispatch({
                                                                                selection,
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
                            </div>
                        )}
                    </Files>
                );
            }}
        </Query>
    );
}

export default compose(
    graphql(createFile, { name: "gqlCreateFile" }),
    withSnackbar()
)(FileManagerView);
