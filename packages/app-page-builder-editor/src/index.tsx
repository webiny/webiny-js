import React from "react";
import { RecoilRoot } from "recoil";
import { Compose, HigherOrderComponent } from "@webiny/app-admin";
import { EditorRenderer, EditorProps } from "@webiny/app-page-builder";
import { EditorState } from "./contexts/EditorState";
import { rootElementAtom, pageAtom, elementsAtom, PageAtomType } from "./state";
import { flattenElements } from "./helpers";
import RecoilExternal from "./components/RecoilExternal";
import { Editor as EditorComponent } from "./components/Editor";
import { EditorProvider } from "~/contexts/Editor";
import { PbEditorElement } from "~/types";
import omit from "lodash/omit";

const EditorHOC: HigherOrderComponent<EditorProps> = () => {
    return function Editor({ page, revisions }) {
        return (
            <EditorProvider>
                <RecoilRoot
                    initializeState={({ set }) => {
                        /* Here we initialize elementsAtom and rootElement if it exists */
                        set(rootElementAtom, page.content.id);

                        // Type casting here because we know that data from API will always have a `content` object.
                        const elements = flattenElements(page.content as PbEditorElement);
                        Object.keys(elements).forEach(key => {
                            set(elementsAtom(key), elements[key]);
                        });

                        // Unsetting the `content` object because content is reconstructed from a flat structure on each
                        // save; thus, we don't need to store this massive object into our state.
                        const pageData: PageAtomType = omit(page, ["content"]);
                        set(pageAtom, pageData);
                    }}
                >
                    <RecoilExternal />
                    <EditorState />
                    <EditorComponent page={page} revisions={revisions} />
                </RecoilRoot>
            </EditorProvider>
        );
    };
};

export const Editor = () => {
    return <Compose component={EditorRenderer} with={EditorHOC} />;
};
