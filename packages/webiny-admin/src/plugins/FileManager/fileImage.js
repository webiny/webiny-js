// @flow
import React, { useReducer } from "react";
import { css } from "emotion";
import { ImageEditorDialog } from "webiny-ui/ImageUpload";
import dataURLtoBlob from "dataurl-to-blob";
import { Image } from "webiny-app/components";
import { Tooltip } from "webiny-ui/Tooltip";
import { IconButton } from "webiny-ui/Button";
import { ReactComponent as EditIcon } from "./icons/edit.svg";
import { Hotkeys } from "react-hotkeyz";
import outputFileSelectionError from "webiny-admin/components/FileManager/outputFileSelectionError";
import { withSnackbar } from "webiny-admin/components";

const styles = css({
    maxHeight: 200,
    maxWidth: 200,
    width: "auto",
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translateX(-50%) translateY(-50%)"
});

function toDataUrl(url) {
    return new Promise(resolve => {
        const xhr = new window.XMLHttpRequest();
        xhr.onload = function() {
            const reader = new window.FileReader();
            reader.onloadend = function() {
                resolve(reader.result);
            };
            reader.readAsDataURL(xhr.response);
        };
        xhr.open("GET", url);
        xhr.responseType = "blob";
        xhr.send();
    });
}

const initialState = { showImageEditor: false, dataUrl: null };
const reducer = (state, action) => {
    const next = { ...state };

    switch (action.type) {
        case "setDataUrl":
            next.dataUrl = action.dataUrl;
            next.showImageEditor = true;
            break;
        case "hideImageEditor":
            next.dataUrl = null;
            next.showImageEditor = false;
            break;
    }

    return next;
};

const EditAction = withSnackbar()(function(props: Object) {
    const { file, uploadFile, validateFiles, showSnackbar } = props;
    const [state, dispatch] = useReducer(reducer, initialState);

    return (
        <>
            <Tooltip content={<span>Edit image</span>} placement={"bottom"}>
                <IconButton
                    icon={<EditIcon style={{ margin: "0 8px 0 0" }} />}
                    onClick={async () => {
                        dispatch({ type: "setDataUrl", dataUrl: await toDataUrl(file.src) });
                    }}
                />
            </Tooltip>
            <Hotkeys zIndex={3} disabled={!state.dataUrl}>
                <ImageEditorDialog
                    dialogZIndex={10}
                    open={state.showImageEditor}
                    src={state.dataUrl}
                    onClose={() => dispatch({ type: "hideImageEditor" })}
                    onAccept={src => {
                        const blob = dataURLtoBlob(src);
                        const errors = validateFiles([blob]);

                        if (errors.length) {
                            showSnackbar(outputFileSelectionError(errors));
                        } else {
                            blob.name = file.name;
                            uploadFile(blob);
                        }

                        dispatch({ type: "hideImageEditor" });
                    }}
                />
            </Hotkeys>
        </>
    );
});

export default {
    name: "file-manager-file-type-image",
    type: "file-manager-file-type",
    types: ["image/jpeg", "image/jpg", "image/gif", "image/png", "image/svg+xml"],
    render: function render({ file }: Object) {
        return (
            <Image className={styles} src={file.src} alt={file.name} transform={{ width: 300 }} />
        );
    },
    fileDetails: {
        actions: [EditAction]
    }
};
