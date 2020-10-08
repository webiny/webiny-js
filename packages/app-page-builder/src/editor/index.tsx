import React from "react";
import { Editor as EditorComponent } from "./components/Editor";
import { EditorProvider } from "./provider";
import { RecoilRoot } from "recoil";
import { RecoilUndoRoot } from "recoil-undo";

export const Editor = () => {
    return (
        <RecoilRoot>
            <RecoilUndoRoot>
                <EditorProvider>
                    <EditorComponent />
                </EditorProvider>
            </RecoilUndoRoot>
        </RecoilRoot>
    );
};
