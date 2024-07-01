import React, { useState } from "react";
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

export const ImageEditorDialog = (props: ImageEditorDialogProps) => {
    const { src, options, onAccept, open, dialogZIndex, ...dialogProps } = props;
    const imageEditor = React.createRef<ImageEditor>();
    const [isSaving, setIsSaving] = useState(false);

    const onSave = async () => {
        try {
            setIsSaving(true);
            const url = imageEditor.current ? imageEditor.current.getCanvasDataUrl() : "";
            await onAccept(url);
        } catch (e) {
            console.log(e);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog
            className={imageEditorDialog}
            style={{ zIndex: dialogZIndex }}
            open={open}
            {...dialogProps}
        >
            {open && (
                <ImageEditor ref={imageEditor} src={src} options={options}>
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
                                        onClick={onSave}
                                        disabled={isSaving}
                                    >
                                        {isSaving ? "Saving..." : "Save"}
                                    </ButtonPrimary>
                                )}
                            </DialogActions>
                        </>
                    )}
                </ImageEditor>
            )}
        </Dialog>
    );
};
