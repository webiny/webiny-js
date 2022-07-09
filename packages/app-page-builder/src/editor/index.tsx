import React from "react";
import { Editor as EditorComponent } from "./components/Editor";
import { EditorConfigApply, EditorConfig } from "./components/Editor/EditorConfig";
import { EditorProvider } from "./contexts/EditorProvider";
import { RecoilRoot, RecoilRootProps } from "recoil";

export { EditorConfig };

interface EditorPropsType {
    initializeState: RecoilRootProps["initializeState"];
}

export const Editor: React.FC<EditorPropsType> = ({ initializeState }) => {
    return (
        <RecoilRoot initializeState={initializeState}>
            <EditorProvider>
                <EditorConfigApply />
                <EditorComponent />
            </EditorProvider>
        </RecoilRoot>
    );
};
