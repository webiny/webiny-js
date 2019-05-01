// @flow
import * as React from "react";
import { ImageEditor } from "webiny-ui/ImageEditor";
import { Tooltip } from "webiny-ui/Tooltip";
import { Dialog, DialogAccept, DialogCancel, DialogFooter, DialogBody } from "webiny-ui/Dialog";

type Props = Object & { options?: Object, src: ?string };

class ImageEditorDialog extends React.Component<Props, { imageProcessing: boolean }> {
    imageEditor = React.createRef();

    render() {
        const { src, options, onAccept, open, dialogZIndex, ...dialogProps } = this.props;
        return (
            <Dialog
                style={{ zIndex: dialogZIndex }}
                open={open}
                onAccept={() => onAccept(this.imageEditor.current.getCanvasDataUrl())}
                {...dialogProps}
            >
                {open && (
                    <ImageEditor ref={this.imageEditor} src={src} options={options}>
                        {({ render, activeTool }) => (
                            <>
                                <DialogBody>{render()}</DialogBody>
                                <DialogFooter>
                                    <DialogCancel>Cancel</DialogCancel>
                                    {activeTool ? (
                                        <Tooltip
                                            content={"Please close currently active tool."}
                                            placement={"top"}
                                        >
                                            <DialogAccept disabled>Save</DialogAccept>
                                        </Tooltip>
                                    ) : (
                                        <DialogAccept>Save</DialogAccept>
                                    )}
                                </DialogFooter>
                            </>
                        )}
                    </ImageEditor>
                )}
            </Dialog>
        );
    }
}
export default ImageEditorDialog;
