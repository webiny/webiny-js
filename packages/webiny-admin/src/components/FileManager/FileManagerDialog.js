// @flow
/* eslint-disable */
import React, { useReducer } from "react";
import Files from "react-butterfiles";
import { Grid, Cell } from "webiny-ui/Grid";
import { ButtonPrimary } from "webiny-ui/Button";
import { Tags } from "webiny-ui/Tags";
import { Query } from "react-apollo";
import type { FilesRules } from "react-butterfiles";
import { css } from "emotion";
import { listFiles } from "./graphql";
import get from "lodash.get";
import { File, ImageFile } from "./Files";

const fileManagerDialog = css({
    ".mdc-dialog__surface": {
        width: "80%",
        minWidth: 1200
    }
});

const dropZone = css({});

import {
    Dialog,
    DialogHeader,
    DialogHeaderTitle,
    DialogBody,
    DialogFooter,
    DialogAccept,
    DialogCancel
} from "webiny-ui/Dialog";

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

const initialState = { selected: [] };
function fileManagerReducer(state, action) {
    switch (action.type) {
        case "toggleSelected": {
            const next = { ...state };
            const existingIndex = state.selected.findIndex(item => item.src === action.file.src);
            if (existingIndex < 0) {
                next.selected.push(action.file);
            } else {
                next.selected.splice(existingIndex);
            }

            console.log(next);
            return next;
        }
    }
}

export function FileManagerDialog({ open, files }: Props) {
    const [state, dispatch] = useReducer(fileManagerReducer, initialState);

    return (
        <Dialog open={open} className={fileManagerDialog}>
            <DialogHeader>
                <DialogHeaderTitle>File manager</DialogHeaderTitle>
            </DialogHeader>
            <DialogBody>
                <Files {...files}>
                    {({ getDropZoneProps, browseFiles }) => (
                        <Query query={listFiles}>
                            {({ data }) => {
                                const list = get(data, "files.listFiles.data") || [];
                                return (
                                    <>
                                        <Grid>
                                            <Cell span={6}>
                                                <Tags label={"Tags"}/>
                                            </Cell>
                                            <Cell span={6}>
                                                <ButtonPrimary onClick={browseFiles}>
                                                    Upload...
                                                </ButtonPrimary>
                                            </Cell>
                                        </Grid>

                                        <Grid>
                                            <Cell span={12}>
                                                <div {...getDropZoneProps()} className={dropZone}>
                                                    {list.map(file => {
                                                        let Component =
                                                            components[file.type] || File;
                                                        return (
                                                            <Component
                                                                key={file.src}
                                                                file={file}
                                                                selected={state.selected.find(
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
                                                </div>
                                            </Cell>
                                        </Grid>
                                    </>
                                );
                            }}
                        </Query>
                    )}
                </Files>
            </DialogBody>
            <DialogFooter>
                <DialogCancel>Cancel</DialogCancel>
                <DialogAccept onClick={() => {}}>Choose</DialogAccept>
            </DialogFooter>
        </Dialog>
    );
}
