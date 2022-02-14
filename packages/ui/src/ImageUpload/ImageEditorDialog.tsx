import React from "react";
import { ImageEditor } from "~/ImageEditor";
import { Tooltip } from "~/Tooltip";
import { css } from "emotion";
import {
    Dialog,
    DialogAccept,
    DialogCancel,
    DialogActions,
    DialogContent,
    DialogOnClose
} from "../Dialog";

interface Props {
    dialogZIndex?: number;
    onClose?: DialogOnClose;
    open?: boolean;
    /**
     * We would need to drill down a lot to give correct options.
     * TODO: figure out some other way.
     */
    options?: any;
    src?: string;
    onAccept: (src: string) => void;

    // For testing purposes.
    "data-testid"?: string;
}

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
    public imageEditor: React.RefObject<ImageEditor> = React.createRef();

    public render() {
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
                                            onClick={() => {
                                                /**
                                                 * We are certain that ref exists.
                                                 */
                                                return onAccept(
                                                    this.imageEditor.current!.getCanvasDataUrl()
                                                );
                                            }}
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
