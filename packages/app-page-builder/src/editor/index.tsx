import React from "react";
import { Editor as EditorComponent } from "./components/Editor";
import { EditorProvider } from "./contexts/EditorProvider";
import { RecoilRoot } from "recoil";
import {
    rootElementAtom,
    RevisionsAtomType,
    pageAtom,
    elementsAtom,
    PageAtomType
} from "./recoil/modules";
import { flattenElements } from "./helpers";
import { PbEditorElement } from "../types";

type EditorPropsType = {
    page: PageAtomType & PbEditorElement;
    revisions: RevisionsAtomType;
};

export const Editor: React.FunctionComponent<EditorPropsType> = ({ page, revisions }) => {
    return (
        <RecoilRoot
            initializeState={({ set }) => {
                /* Here we initialize elementsAtom and rootElement if it exists */
                set(rootElementAtom, page.content.id);

                const elements = flattenElements(page.content);
                Object.keys(elements).forEach(key => {
                    set(elementsAtom(key), elements[key]);
                });

                const pageData = { ...page, content: undefined };
                set(pageAtom, pageData);
            }}
        >
            <EditorProvider>
                <EditorComponent page={page} revisions={revisions} />
            </EditorProvider>
        </RecoilRoot>
    );
};
