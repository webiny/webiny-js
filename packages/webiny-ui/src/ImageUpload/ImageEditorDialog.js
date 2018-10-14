// @flow
import * as React from "react";
import { ImageEditor } from "webiny-ui/ImageEditor";

import { Dialog, DialogAccept, DialogCancel, DialogFooter, DialogBody } from "webiny-ui/Dialog";

// Each time ImageEditor makes a change, we store it here, so we can pass it to the onAccept callback.
let resultSrc = "";

const ImageEditorDialog = (props: Object & { src: ?string }) => {
    const { src, onAccept, ...dialogProps } = props;
    return (
        <Dialog {...dialogProps}>
            <DialogBody>
                {src &&
                    dialogProps.open && (
                        <ImageEditor src={src} onChange={src => (resultSrc = src)} />
                    )}
            </DialogBody>
            <DialogFooter>
                <DialogCancel>Cancel</DialogCancel>
                <DialogAccept onClick={() => onAccept(resultSrc)}>Save</DialogAccept>
            </DialogFooter>
        </Dialog>
    );
};

export default ImageEditorDialog;
