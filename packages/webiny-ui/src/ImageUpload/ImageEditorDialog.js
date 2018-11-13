// @flow
import * as React from "react";
import { ImageEditor } from "webiny-ui/ImageEditor";
import { Dialog, DialogAccept, DialogCancel, DialogFooter, DialogBody } from "webiny-ui/Dialog";

type Props = Object & { src: ?string };

class ImageEditorDialog extends React.Component<Props> {
    render() {
        const { src, onAccept, ...dialogProps } = this.props;
        return (
            <Dialog {...dialogProps}>
                <ImageEditor src={src}>
                    {({ render, getCanvasDataUrl, activeTool, applyActiveTool }) => (
                        <>
                            <DialogBody>{render()}</DialogBody>
                            <DialogFooter>
                                <DialogCancel>Cancel</DialogCancel>
                                <DialogAccept
                                    onClick={async () => {
                                        activeTool && (await applyActiveTool());
                                        onAccept(getCanvasDataUrl());
                                    }}
                                >
                                    Save
                                </DialogAccept>
                            </DialogFooter>
                        </>
                    )}
                </ImageEditor>
            </Dialog>
        );
    }
}
export default ImageEditorDialog;
