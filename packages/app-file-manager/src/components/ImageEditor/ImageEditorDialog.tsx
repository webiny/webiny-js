import React, { useState } from "react";
import { ImageEditor } from "./ImageEditor";
import { Dialog, OverlayLoader } from "@webiny/admin-ui";

interface ImageEditorDialogProps {
    dialogZIndex?: number;
    onClose?: () => void;
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

export const ImageEditorDialog = (props: ImageEditorDialogProps) => {
    const { src, options, onAccept, onClose, open, dialogZIndex, ...dialogProps } = props;
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
            style={{ zIndex: dialogZIndex }}
            title={"Edit Image"}
            size={"full"}
            open={open}
            onClose={onClose}
            {...dialogProps}
            actions={
                <>
                    <Dialog.CancelButton />
                    <Dialog.ConfirmButton
                        text={"Save"}
                        data-testid="dialog-accept"
                        onClick={onSave}
                        disabled={isSaving}
                    />
                </>
            }
        >
            {isSaving && <OverlayLoader text={"Creating a new version of the image"} />}
            <ImageEditor ref={imageEditor} src={src} options={options}>
                {({ render }) => render()}
            </ImageEditor>
        </Dialog>
    );
};
