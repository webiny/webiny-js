/**
 * This file contains the base framework for building page editor variations.
 * Currently, we have 2 editors:
 * - page editor
 * - block editor
 *
 * This framework provides the basic mechanics, like d&d elements, element settings, toolbars, etc.
 * Other things, like loading/saving data to and from the GraphQL API, toolbar elements, etc. need
 * to be provided using the composition API, <EditorConfig> component, and `initializeState` prop.
 */
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
export * from "./components/Editor/EditorContent";

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
