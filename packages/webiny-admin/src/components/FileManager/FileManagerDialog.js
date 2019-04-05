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

export function FileManagerDialog({ files }: Props) {
    const [{ selected, queryParams }, dispatch] = useReducer(fileManagerReducer, initialState);

    const formOnChange = debounce(queryParams => {
        dispatch({ type: "queryParams", queryParams });
    }, 500);

    return (
        <Files
            {...files}
            onSuccess={file => {
                console.log("asd", file);
            }}
        >
            {({ getDropZoneProps, browseFiles }) => (
                <div {...getDropZoneProps()}>
                    <Form onChange={formOnChange}>
                        {({ Bind }) => (
                            <OverlayLayout
                                barMiddle={() => {}}
                                onExited={() => {}}
                                barLeft={
                                    <Bind name={"search"}>
                                        <Input label={"Search"} />
                                    </Bind>
                                }
                                barRight={
                                    <ButtonPrimary onClick={browseFiles}>Upload...</ButtonPrimary>
                                }
                            >
                                <Query query={listFiles} variables={queryParams}>
                                    {({ data }) => {
                                        const list = get(data, "files.listFiles.data") || [];
                                        return (
                                            <>
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
