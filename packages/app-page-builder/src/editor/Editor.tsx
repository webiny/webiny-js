/**
 * This file contains the base framework for building editor variations.
 * Currently, we have 2 editors:
 * - page editor
 * - block editor
 *
 * This framework provides the basic mechanics, like d&d elements, element settings, toolbars, etc.
 * Other things, like loading/saving data to and from the GraphQL API, toolbar elements, etc. need
 * to be provided using the composition API, <EditorConfig> component, and `createStateInitializer` prop.
 */
import React, { useCallback } from "react";
import { RecoilRoot, MutableSnapshot } from "recoil";
import { Editor as EditorComponent } from "./components/Editor";
import { EditorConfigApply } from "./components/Editor/EditorConfig";
import { EditorProvider } from "./contexts/EditorProvider";
import { EditorDefaultConfig } from "./config/EditorDefaultConfig";
import { HTML5Backend } from "react-dnd-html5-backend";
import { DndProvider } from "react-dnd";
import { elementsAtom, rootElementAtom } from "~/editor/recoil/modules";
import { flattenElements } from "~/editor/helpers";
import { PbEditorElement } from "~/types";

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

export const Editor: React.FC<EditorProps> = ({ stateInitializerFactory }) => {
    const initializeState = useCallback(
        snapshot => {
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
