// @flow
/* eslint-disable */
import React, { useReducer } from "react";
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
import DropFilesHere from "./DropFilesHere";
import { OverlayLayout } from "webiny-admin/components/OverlayLayout";
import { withSnackbar } from "webiny-admin/components";
import { compose } from "recompose";
import { graphql } from "react-apollo";

type Props = {
    onChange: Function,
    onClose: Function,
    selection: FilesRules
};

function init(props) {
    return {
        selected: [],
        queryParams: {
            types: props.selection.accept
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
                types: state.queryParams.types,
                ...action.queryParams
            };
            break;
        }
    }

    return next;
}

function FileManagerDialog(props: Props) {
    const { onClose, onChange, selection, gqlCreateFile, showSnackbar } = props;
    const [{ selected, queryParams }, dispatch] = useReducer(fileManagerReducer, props, init);

    const formOnChange = debounce(queryParams => {
        dispatch({ type: "queryParams", queryParams });
    }, 500);

    return (
        <Query query={listFiles} variables={queryParams}>
            {({ data, refetch }) => {
                const list = get(data, "files.listFiles.data") || [];
                return (
                    <Files
                        {...selection}
                        onSuccess={async files => {
                            // TODO: snackbar se ne vidi (z-index issue?)
                            showSnackbar("File upload started...");

                            const uploadFile = getFileUploader();
                            await Promise.all(
                                files.map(async file => {
                                    const response = await uploadFile(file);
                                    await gqlCreateFile({ variables: { data: response } });
                                })
                            );

                            refetch();
                            showSnackbar("File upload completed.");
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
                                                            console.log(selected[0]);
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
                                                <Grid>
                                                    <Cell span={12}>
                                                        {list.length === 0 && <DropFilesHere />}
                                                        {list.map(file =>
                                                            renderFile({
                                                                file,
                                                                selected: selected.find(
                                                                    current =>
                                                                        current.src === file.src
                                                                ),
                                                                onClick: () =>
                                                                    dispatch({
                                                                        selection,
                                                                        type: "toggleSelected",
                                                                        file
                                                                    })
                                                            })
                                                        )}
                                                    </Cell>
                                                </Grid>
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
)(FileManagerDialog);
