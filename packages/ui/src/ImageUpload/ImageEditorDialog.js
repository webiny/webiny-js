// @flow
import * as React from "react";
import { ImageEditor } from "@webiny/ui/ImageEditor";
import { Tooltip } from "@webiny/ui/Tooltip";
import { css } from "emotion";
import {
    Dialog,
    DialogAccept,
    DialogCancel,
    DialogActions,
    DialogContent
} from "@webiny/ui/Dialog";

type Props = Object & { options?: Object, src: ?string };

const imageEditorDialog = css({
    width: "100vw",
    height: "100vh",
    ".mdc-dialog__surface": {
        maxWidth: "100% !important",
        maxHeight: "100% !important",
        ".webiny-ui-dialog__content": {
            maxWidth: "100% !important",
            maxHeight: "100% !important",
            width: "100vw",
            height: "100vh",
            paddingTop: "0 !important"
        }
    }
});

class ImageEditorDialog extends React.Component<Props, { imageProcessing: boolean }> {
    imageEditor = React.createRef();

    render() {
        const { src, options, onAccept, open, dialogZIndex, ...dialogProps } = this.props;

        return (
            <Dialog
                className={imageEditorDialog}
                style={{ zIndex: dialogZIndex }}
                open={open}
                {...dialogProps}
            >
                {open && (
                    <ImageEditor ref={this.imageEditor} src={src} options={options}>
                        {({ render, activeTool }) => (
                            <>
                                <DialogContent>{render()}</DialogContent>
                                <DialogActions>
                                    <DialogCancel>Cancel</DialogCancel>
                                    {activeTool ? (
                                        <Tooltip
                                            content={"Please close currently active tool."}
                                            placement={"top"}
                                        >
                                            <DialogAccept disabled>Save</DialogAccept>
                                        </Tooltip>
                                    ) : (
                                        <DialogAccept
                                            onClick={() =>
                                                onAccept(
                                                    this.imageEditor.current.getCanvasDataUrl()
                                                )
                                            }
                                        >
                                            Save
                                        </DialogAccept>
                                    )}
                                </DialogActions>
                            </>
                        )}
                    </ImageEditor>
                )}
            </Dialog>
        );
    }
}
export default ImageEditorDialog;
