import React from "react";
import { ImageEditor } from "~/ImageEditor";
import { Tooltip } from "~/Tooltip";
import { css } from "emotion";
import { Dialog, DialogCancel, DialogActions, DialogContent, DialogOnClose } from "../Dialog";
import { ButtonPrimary } from "~/Button";

interface ImageEditorDialogProps {
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

interface ImageEditorDialogState {
    imageProcessing: boolean;
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

class ImageEditorDialog extends React.Component<ImageEditorDialogProps, ImageEditorDialogState> {
    public imageEditor = React.createRef<ImageEditor>();

    public override render() {
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
                                            <ButtonPrimary disabled>Save</ButtonPrimary>
                                        </Tooltip>
                                    ) : (
                                        <ButtonPrimary
                                            data-testid="dialog-accept"
                                            onClick={() => {
                                                const url = this.imageEditor.current
                                                    ? this.imageEditor.current.getCanvasDataUrl()
                                                    : "";
                                                /**
                                                 * We are certain that ref exists.
                                                 */
                                                onAccept(url);
                                            }}
                                        >
                                            Save
                                        </ButtonPrimary>
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
