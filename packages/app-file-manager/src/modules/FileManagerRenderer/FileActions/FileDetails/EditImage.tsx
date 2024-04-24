import React from "react";
// @ts-expect-error
import { Hotkeys } from "react-hotkeyz";
// @ts-expect-error
import dataURLtoBlob from "dataurl-to-blob";
import { ImageEditorDialog } from "@webiny/ui/ImageUpload";
import { ReactComponent as EditIcon } from "@material-design-icons/svg/outlined/edit.svg";
import { FileManagerViewConfig, useFile, useFileManagerApi, useFileManagerView } from "~/index";

function toDataUrl(url: string): Promise<string> {
    return new Promise((resolve: (value: string) => void) => {
        const xhr = new window.XMLHttpRequest();
        xhr.onload = function () {
            const reader = new window.FileReader();
            reader.onloadend = function () {
                resolve(reader.result as string);
            };
            reader.readAsDataURL(xhr.response);
        };
        xhr.open("GET", url);
        xhr.responseType = "blob";
        xhr.send();
    });
}

interface State {
    showImageEditor: boolean;
    dataUrl: string | null;
}

interface Action {
    type: "setDataUrl" | "hideImageEditor";
    dataUrl?: string | null;
}

const initialState: State = {
    showImageEditor: false,
    dataUrl: null
};

const reducer = (state: State, action: Action): State => {
    const next: State = { ...state };

    switch (action.type) {
        case "setDataUrl":
            next.dataUrl = action.dataUrl as string;
            next.showImageEditor = true;
            break;
        case "hideImageEditor":
            next.dataUrl = null;
            next.showImageEditor = false;
            break;
    }

    return next;
};

const { FileDetails } = FileManagerViewConfig;

export const EditImage = () => {
    const { file } = useFile();
    const { canEdit } = useFileManagerApi();
    const { uploadFile } = useFileManagerView();
    const [state, dispatch] = React.useReducer(reducer, initialState);

    if (!file.type.startsWith("image/")) {
        return null;
    }

    // Render nothing if the user doesn't have the required permissions for "edit".
    if (!canEdit(file)) {
        return null;
    }

    return (
        <>
            <FileDetails.Action.IconButton
                label={"Edit image"}
                data-testid={"fm-edit-image-button"}
                icon={<EditIcon style={{ margin: "0 8px 0 0" }} />}
                onAction={async () => {
                    const dataUrl = await toDataUrl(file.src);
                    dispatch({ type: "setDataUrl", dataUrl });
                }}
            />
            <Hotkeys zIndex={60} disabled={!state.dataUrl}>
                <ImageEditorDialog
                    data-testid={"fm-image-editor-dialog"}
                    dialogZIndex={100}
                    open={state.showImageEditor}
                    src={state.dataUrl as string}
                    onClose={() => dispatch({ type: "hideImageEditor" })}
                    onAccept={src => {
                        const blob = dataURLtoBlob(src);
                        blob.name = file.name;
                        blob.key = file.key.split("/").pop();
                        uploadFile(blob);
                        dispatch({ type: "hideImageEditor" });
                    }}
                />
            </Hotkeys>
        </>
    );
};
