import React from "react";
import { Editor as EditorComponent } from "./components/Editor";
import { EditorConfigApply, EditorConfig } from "./components/Editor/EditorConfig";
import { EditorProvider } from "./contexts/EditorProvider";
import { RecoilRoot, RecoilRootProps } from "recoil";
import { EditorDefaultConfig } from "./config/EditorDefaultConfig";
import { HTML5Backend } from "react-dnd-html5-backend";
import { DndProvider } from "react-dnd";

export { EditorConfig };
export * from "./components/Editor/EditorBar";

interface EditorPropsType {
    initializeState: RecoilRootProps["initializeState"];
}

export const Editor: React.FC<EditorPropsType> = ({ initializeState }) => {
    return (
        <DndProvider backend={HTML5Backend}>
            <RecoilRoot initializeState={initializeState}>
                <EditorProvider>
                    <EditorDefaultConfig />
                    <EditorConfigApply />
                    <EditorComponent />
                </EditorProvider>
            </RecoilRoot>
        </DndProvider>
    );
};
