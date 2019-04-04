// @flow
/* eslint-disable */
import React, { useReducer } from "react";
import Files from "react-butterfiles";
import { Grid, Cell } from "webiny-ui/Grid";
import { ButtonPrimary } from "webiny-ui/Button";
import { Query } from "react-apollo";
import type { FilesRules } from "react-butterfiles";
import { css } from "emotion";
import { listFiles } from "./graphql";
import get from "lodash.get";
import { File, ImageFile } from "./Files";

const initialState = { onAccept: null, show: false };
function fileManagerReducer(state, action) {
    switch (action.type) {
        case "show": {
            const { onAccept } = action;
            return { ...state, show: true, onAccept: onAccept };
        }
        case "decrement":
            return { ...state, show: false, onAccept: null };
    }
}

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

function renderFile(file) {
    let Component = components[file.type] || File;
    return <Component key={file.src} file={file} />;
}

export function FileManagerDialog({ open, files }: Props) {
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
                                const files = get(data, "files.listFiles.data") || [];
                                return (
                                    <>
                                        <Grid>
                                            <Cell span={6}>left</Cell>
                                            <Cell span={6}>
                                                right
                                                <ButtonPrimary onClick={browseFiles}>
                                                    Upload...
                                                </ButtonPrimary>
                                            </Cell>
                                        </Grid>

                                        <Grid>
                                            <Cell span={12}>
                                                <div {...getDropZoneProps()} className={dropZone} />
                                                {files.map(renderFile)}
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
