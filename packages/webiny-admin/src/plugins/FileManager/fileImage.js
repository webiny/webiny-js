// @flow
import React, { useReducer } from "react";
import { css } from "emotion";
import { ImageEditorDialog } from "webiny-ui/ImageUpload";
import dataURLtoBlob from "dataurl-to-blob";

const styles = css({
    height: 200,
    width: "auto"
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

function renderEdit({ MenuItem, file, uploadFile }) {
    const [state, dispatch] = useReducer(reducer, initialState);

    return (
        <>
            <MenuItem
                onClick={async () =>
                    dispatch({ type: "setDataUrl", dataUrl: await toDataUrl(file.src) })
                }
            >
                Edit
            </MenuItem>
            <ImageEditorDialog
                // options={imageEditor}
                open={state.showImageEditor}
                src={state.dataUrl}
                onClose={() => dispatch({ type: "hideImageEditor" })}
                onAccept={src => {
                    const blob = dataURLtoBlob(src);
                    blob.name = file.name;
                    uploadFile(blob);
                    dispatch({ type: "hideImageEditor" });
                }}
            />
        </>
    );
}

export default {
    name: "file-manager-file-type-image",
    type: "file-manager-file-type",
    types: ["image/jpeg", "image/jpg", "image/gif", "image/png"],
    options: [renderEdit],
    render(file) {
        return <img className={styles} src={file.src} alt={file.name} />;
    }
};
