import React from "react";
import editorMock from "~/admin/assets/editor-mock.png";
import { Typography } from "@webiny/ui/Typography";
import { LoadingEditor, LoadingTitle } from "./EditorLoadingScreen.styles";

export const EditorLoadingScreen = () => {
    return (
        <LoadingEditor>
            <img src={editorMock} alt={"page builder editor mock"} />
            <LoadingTitle>
                <Typography tag={"div"} use={"headline6"}>
                    Loading Editor<span>.</span>
                    <span>.</span>
                    <span>.</span>
                </Typography>
            </LoadingTitle>
        </LoadingEditor>
    );
};
