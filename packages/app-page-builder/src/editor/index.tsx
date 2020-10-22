import React from "react";
import { ConnectedStoreComponent } from "@webiny/app-page-builder/editor/recoil/modules/connected";
import { Editor as EditorComponent } from "./components/Editor";
import { EditorProvider } from "./provider";
import { RecoilRoot } from "recoil";
import { RecoilUndoRoot } from "recoil-undo";
import {
    elementsAtom,
    pageAtom,
    PageAtomType,
    pluginsAtom,
    uiAtom
} from "@webiny/app-page-builder/editor/recoil/modules";

type EditorPropsType = {
    page: PageAtomType;
};
export const Editor: React.FunctionComponent<EditorPropsType> = ({ page }) => {
    return (
        <RecoilRoot>
            <ConnectedStoreComponent />
            <RecoilUndoRoot trackedAtoms={[uiAtom, elementsAtom, pageAtom, pluginsAtom]}>
                <EditorProvider>
                    <EditorComponent page={page} />
                </EditorProvider>
            </RecoilUndoRoot>
        </RecoilRoot>
    );
};
export { useEventActionHandler } from "./provider";
