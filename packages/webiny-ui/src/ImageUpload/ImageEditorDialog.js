// @flow
import * as React from "react";
import { ImageEditor } from "webiny-ui/ImageEditor";
import { type FileBrowserFile } from "webiny-ui/FileBrowser";

import {
    Dialog,
    DialogAccept,
    DialogCancel,
    DialogFooter,
    DialogHeader,
    DialogHeaderTitle,
    DialogBody
} from "webiny-ui/Dialog";

let editedSrc = "";

const ImageEditorDialog = (props: Object & { image: ?FileBrowserFile }) => {
    const { image, onAccept, onCancel, ...dialogProps } = props;
    return (
        <Dialog {...dialogProps}>
            <DialogHeader>
                <DialogHeaderTitle>Image Editor</DialogHeaderTitle>
            </DialogHeader>
            <DialogBody>
                {image && (
                    <ImageEditor
                        src={image.src}
                        onChange={src => {
                            console.log(src)
                            // editedSrc = src;
                        }}
                    />
                )}
            </DialogBody>
            <DialogFooter>
                <DialogAccept onClick={() => onAccept(editedSrc)}>Save</DialogAccept>
                <DialogCancel onClick={() => onCancel()}>Cancel</DialogCancel>
            </DialogFooter>
        </Dialog>
    );
};

export default ImageEditorDialog;
