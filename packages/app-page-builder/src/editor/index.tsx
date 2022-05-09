import React from "react";
import { Editor as EditorComponent } from "./components/Editor";
import { EditorProvider } from "./contexts/EditorProvider";
import { RecoilRoot } from "recoil";
import {
    rootElementAtom,
    RevisionsAtomType,
    pageAtom,
    elementsAtom,
    PageAtomType,
    PageWithContent
} from "./recoil/modules";
import { flattenElements } from "./helpers";
import omit from "lodash/omit";

interface EditorPropsType {
    page: PageWithContent;
    revisions: RevisionsAtomType;
}

export const Editor: React.FC<EditorPropsType> = ({ page, revisions }) => {
    return (
        <RecoilRoot
            initializeState={({ set }) => {
                /* Here we initialize elementsAtom and rootElement if it exists */
                set(rootElementAtom, page.content?.id || "");

                const elements = flattenElements(page.content);
                Object.keys(elements).forEach(key => {
                    set(elementsAtom(key), elements[key]);
                });
                /**
                 * We always unset the content because we are not using it via the page atom.
                 */
                const pageData: PageAtomType = omit(page, ["content"]);

                set(pageAtom, pageData);
            }}
        >
            <EditorProvider>
                <EditorComponent page={page} revisions={revisions} />
            </EditorProvider>
        </RecoilRoot>
    );
};
