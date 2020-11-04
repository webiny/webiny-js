import React from "react";
import { ConnectedStoreComponent } from "@webiny/app-page-builder/editor/recoil/modules/connected";
import { Editor as EditorComponent } from "./components/Editor";
import { EditorProvider } from "./provider";
import { RecoilRoot } from "recoil";
import { RecoilUndoRoot } from "recoil-undo";
import {
    contentAtom,
    PageAtomType,
    RevisionsAtomType
} from "@webiny/app-page-builder/editor/recoil/modules";

type EditorPropsType = {
    page: PageAtomType;
    revisions: RevisionsAtomType;
};

export const Editor: React.FunctionComponent<EditorPropsType> = ({ page, revisions }) => {
    return (
        <RecoilRoot>
            <RecoilUndoRoot trackingByDefault={false} trackedAtoms={[contentAtom]}>
                <ConnectedStoreComponent />
                <EditorProvider>
                    <EditorComponent page={page} revisions={revisions} />
                </EditorProvider>
            </RecoilUndoRoot>
        </RecoilRoot>
    );
};
export { useEventActionHandler } from "./provider";
