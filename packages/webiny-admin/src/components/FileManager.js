// @flow
import React, { useReducer } from "react";
import type { FilesRules } from "react-butterfiles";
import { FileManagerDialog } from "./FileManager/FileManagerDialog";

const initialState = { onAccept: null, show: false };
function fileManagerReducer(state, action) {
    switch (action.type) {
        case "show": {
            const { onAccept } = action;
            return { ...state, show: true, onAccept: onAccept };
        }
        case "decrement":
            return { ...state, show: false, onAccept: null };
    }
}

function FileManager(props: FilesRules) {
    const [{ show }, dispatch] = useReducer(fileManagerReducer, initialState);

    return (
        <>
            <FileManagerDialog open={show} files={props} />
            {props.children({
                hideFileManager: () => dispatch({ type: "hide" }),
                showFileManager: onAccept => dispatch({ type: "show", onAccept })
            })}
        </>
    );
}

export { FileManager };
