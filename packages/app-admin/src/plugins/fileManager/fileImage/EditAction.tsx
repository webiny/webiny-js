import * as React from "react";
import { Hotkeys } from "react-hotkeyz";
import dataURLtoBlob from "dataurl-to-blob";
import { ImageEditorDialog } from "@webiny/ui/ImageUpload";
import { Tooltip } from "@webiny/ui/Tooltip";
import { IconButton } from "@webiny/ui/Button";
import outputFileSelectionError from "../../../components/FileManager/outputFileSelectionError";
import { useSnackbar } from "../../../hooks/useSnackbar";
import { ReactComponent as EditIcon } from "../icons/edit.svg";

function toDataUrl(url) {
    return new Promise(resolve => {
        const xhr = new window.XMLHttpRequest();
        xhr.onload = function () {
            const reader = new window.FileReader();
            reader.onloadend = function () {
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

// TODO: @adrian
type EditActionProps = {
    file: any;
    uploadFile: any;
    validateFiles: any;
    canEdit: (file: any) => boolean;
};

const EditAction: React.FC<EditActionProps> = props => {
    const { file, uploadFile, validateFiles, canEdit } = props;
    const [state, dispatch] = React.useReducer(reducer, initialState);
    const { showSnackbar } = useSnackbar();
    // Render nothing if the user don't have required permission for "edit".
    if (!canEdit(file)) {
        return null;
    }

    return (
        <>
            <Tooltip content={<span>Edit image</span>} placement={"bottom"}>
                <IconButton
                    data-testid={"fm-edit-image-button"}
                    icon={<EditIcon style={{ margin: "0 8px 0 0" }} />}
                    onClick={async () => {
                        dispatch({ type: "setDataUrl", dataUrl: await toDataUrl(file.src) });
                    }}
                />
            </Tooltip>
            <Hotkeys zIndex={60} disabled={!state.dataUrl}>
                <ImageEditorDialog
                    data-testid={"fm-image-editor-dialog"}
                    dialogZIndex={100}
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
};

export default EditAction;
