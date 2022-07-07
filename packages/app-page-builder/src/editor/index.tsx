import React from "react";
import { Editor as EditorComponent } from "./components/Editor";
import { EditorProvider } from "./contexts/EditorProvider";
import { RecoilRoot, RecoilRootProps } from "recoil";

interface EditorPropsType {
    initializeState: RecoilRootProps["initializeState"];
}

export const Editor: React.FC<EditorPropsType> = ({ initializeState }) => {
    return (
        <RecoilRoot initializeState={initializeState}>
            <EditorProvider>
                <EditorComponent />
            </EditorProvider>
        </RecoilRoot>
    );
};
