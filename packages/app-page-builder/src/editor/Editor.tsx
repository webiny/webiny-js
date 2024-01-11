import React, { useCallback } from "react";
import { RecoilRoot, MutableSnapshot } from "recoil";
import { Editor as EditorComponent } from "./components/Editor";
import { EditorConfigApply } from "./components/Editor/EditorConfig";
import { EditorProvider } from "./contexts/EditorProvider";
import { HTML5Backend } from "react-dnd-html5-backend";
import { DndProvider } from "react-dnd";
import { elementsAtom, rootElementAtom } from "~/editor/recoil/modules";
import { flattenElements } from "~/editor/helpers";
import { PbEditorElement } from "~/types";
import { EditorWithConfig } from "~/editor/config";

export interface EditorStateInitializerFactory {
    (): EditorStateInitializer;
}

export interface EditorStateInitializer {
    content: PbEditorElement;
    recoilInitializer: (mutableSnapshot: MutableSnapshot) => void;
}

export interface EditorProps {
    stateInitializerFactory: EditorStateInitializerFactory;
}

export const Editor = ({ stateInitializerFactory }: EditorProps) => {
    const initializeState = useCallback(
        (snapshot: MutableSnapshot) => {
            const { content, recoilInitializer } = stateInitializerFactory();

            /* Here we initialize elementsAtom and rootElement if it exists. */
            snapshot.set(rootElementAtom, content.id || "");

            const elements = flattenElements(content);
            Object.keys(elements).forEach(key => {
                snapshot.set(elementsAtom(key), elements[key]);
            });

            recoilInitializer(snapshot);
        },
        [stateInitializerFactory]
    );

    return (
        // 'children' prop missing from DndProvider types before react-dnd v14.0.5.
        // @ts-expect-error
        <DndProvider backend={HTML5Backend}>
            <RecoilRoot initializeState={initializeState}>
                <EditorProvider>
                    <EditorConfigApply />
                    <EditorWithConfig>
                        <EditorComponent />
                    </EditorWithConfig>
                </EditorProvider>
            </RecoilRoot>
        </DndProvider>
    );
};
