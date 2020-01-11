import * as React from "react";
import { ImageEditor } from "@webiny/ui/ImageEditor";
import { Tooltip } from "@webiny/ui/Tooltip";
import { css } from "emotion";
import {
    Dialog,
    DialogAccept,
    DialogCancel,
    DialogActions,
    DialogContent,
    DialogOnClose
} from "@webiny/ui/Dialog";

type Props = {
    dialogZIndex?: number;
    onClose?: DialogOnClose;
    open?: boolean;
    options?: Object;
    src?: string;
    onAccept: (src: string) => void;
};

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
    imageEditor: React.RefObject<ImageEditor> = React.createRef();

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
                    <ImageEditor
                        ref={this.imageEditor as React.Ref<any>}
                        src={src}
                        options={options}
                    >
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
