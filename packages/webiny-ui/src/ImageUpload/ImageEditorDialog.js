// @flow
import * as React from "react";
import { ImageEditor } from "webiny-ui/ImageEditor";
import { Dialog, DialogAccept, DialogCancel, DialogFooter, DialogBody } from "webiny-ui/Dialog";

type Props = Object & { options?: Object, src: ?string };

class ImageEditorDialog extends React.Component<Props> {
    imageEditor = React.createRef();

    componentDidUpdate(previousProps) {
        // Reset form when closing the dialog.
        const open = { previous: previousProps.open, current: this.props.open };
        if (open.previous && !open.current) {
            // Added timeout to avoid minor text flicker when closing the dialog.
            this.imageEditor.current.resetCanvas();
        }
    }

    render() {
        const { src, options, onAccept, ...dialogProps } = this.props;
        return (
            <Dialog {...dialogProps}>
                <ImageEditor src={src} ref={this.imageEditor} options={options}>
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
