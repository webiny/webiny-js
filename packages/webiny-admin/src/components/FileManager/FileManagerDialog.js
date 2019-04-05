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
import { listFiles } from "./graphql";
import { get, debounce } from "lodash";
import { File, ImageFile } from "./Files";
import { OverlayLayout } from "webiny-admin/components/OverlayLayout";
import { withSnackbar } from "webiny-admin/components";

type Props = {
    open: boolean,
    files: FilesRules
};

const components = {
    "image/jpeg": ImageFile,
    "image/jpg": ImageFile,
    "image/gif": ImageFile,
    "image/png": ImageFile
};

const initialState = { selected: [], queryParams: {} };
function fileManagerReducer(state, action) {
    const next = { ...state };
    switch (action.type) {
        case "toggleSelected": {
            const existingIndex = state.selected.findIndex(item => item.src === action.file.src);
            if (existingIndex < 0) {
                next.selected.push(action.file);
            } else {
                next.selected.splice(existingIndex, 1);
            }
            break;
        }
        case "queryParams": {
            next.queryParams = action.queryParams;
            break;
        }
    }

    return next;
}

function FileManagerDialog({ files, showSnackbar }: Props) {
    const [{ selected, queryParams }, dispatch] = useReducer(fileManagerReducer, initialState);

    const formOnChange = debounce(queryParams => {
        dispatch({ type: "queryParams", queryParams });
    }, 500);

    return (
        <Files
            {...files}
            onSuccess={file => {
                // TODO: snackbar se ne vidi (z-index issue)
                showSnackbar("File upload started...");
                console.log("File:", file);
            }}
        >
            {({ getDropZoneProps, browseFiles }) => (
                <div {...getDropZoneProps()}>
                    <Form onChange={formOnChange}>
                        {({ Bind }) => (
                            <OverlayLayout
                                barMiddle={() => {}}
                                onExited={() => {}}
                                barRight={
                                    <ButtonPrimary onClick={browseFiles}>Upload...</ButtonPrimary>
                                }
                            >
                                <Query query={listFiles} variables={queryParams}>
                                    {({ data, loading }) => {
                                        const list = get(data, "files.listFiles.data") || [];
                                        return (
                                            <>
                                                <Bind name={"search"}>
                                                    <Input
                                                        disabled={loading}
                                                        label={"Search by filename or tags"}
                                                    />
                                                </Bind>
                                                <Grid>
                                                    <Cell span={12}>
                                                        {list.map(file => {
                                                            let Component =
                                                                components[file.type] || File;

                                                            return (
                                                                <Component
                                                                    key={file.src}
                                                                    file={file}
                                                                    selected={selected.find(
                                                                        current =>
                                                                            current.src === file.src
                                                                    )}
                                                                    onClick={() =>
                                                                        dispatch({
                                                                            type: "toggleSelected",
                                                                            file
                                                                        })
                                                                    }
                                                                />
                                                            );
                                                        })}
                                                    </Cell>
                                                </Grid>
                                            </>
                                        );
                                    }}
                                </Query>
                            </OverlayLayout>
                        )}
                    </Form>
                </div>
            )}
        </Files>
    );
}

export default withSnackbar()(FileManagerDialog);
