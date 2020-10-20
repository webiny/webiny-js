import React from "react";
import { ConnectedStoreComponent } from "@webiny/app-page-builder/editor/recoil/modules/connected";
import { Editor as EditorComponent } from "./components/Editor";
import { EditorProvider } from "./provider";
import { RecoilRoot } from "recoil";
import { RecoilUndoRoot } from "recoil-undo";
import {
    elementsAtom,
    pageAtom,
    pluginsAtom,
    uiAtom
} from "@webiny/app-page-builder/editor/recoil/modules";

export const Editor = () => {
    return (
        <RecoilRoot>
            <ConnectedStoreComponent />
            <RecoilUndoRoot trackedAtoms={[uiAtom, elementsAtom, pageAtom, pluginsAtom]}>
                <EditorProvider>
                    <EditorComponent />
                </EditorProvider>
            </RecoilUndoRoot>
        </RecoilRoot>
    );
};
export { useEditor } from "./provider";
