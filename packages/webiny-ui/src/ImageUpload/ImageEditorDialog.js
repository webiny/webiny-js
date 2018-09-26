// @flow
import * as React from "react";
import { ImageEditor } from "webiny-ui/ImageEditor";

import {
    Dialog,
    DialogAccept,
    DialogFooter,
    DialogHeader,
    DialogHeaderTitle,
    DialogBody
} from "webiny-ui/Dialog";

const PolicyEditorDialog = (props: { children: React.Node }) => {
    return (
        <Dialog {...props}>
            <DialogHeader>
                <DialogHeaderTitle>Image Editor</DialogHeaderTitle>
            </DialogHeader>
            <DialogBody>
                <ImageEditor />
            </DialogBody>
            <DialogFooter>
                <DialogAccept>Close</DialogAccept>
            </DialogFooter>
        </Dialog>
    );
};

export default PolicyEditorDialog;
