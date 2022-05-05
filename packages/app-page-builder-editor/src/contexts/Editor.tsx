import React from "react";
import { getState, setState } from "~/components/RecoilExternal";
import { activeElementAtom, pageAtom, PageAtomType, rootElementAtom } from "~/state";

export interface Editor {
    activateElement(id: string): void;
    deactivateElement(id: string): void;
    getRootElementId(): string;
    getPage(): PageAtomType;
}

export interface EditorContext {
    editor: Editor;
}

export const EditorContext = React.createContext<EditorContext>({} as EditorContext);

export const EditorProvider: React.FC = ({ children }) => {
    const context: EditorContext = {
        editor: {
            getRootElementId(): string {
                return getState(rootElementAtom) || "";
            },
            activateElement(id: string) {
                setState(activeElementAtom, id);
            },

            deactivateElement() {
                setState(activeElementAtom, undefined);
            },
            getPage() {
                return getState(pageAtom);
            }
        }
    };
    return <EditorContext.Provider value={context}>{children}</EditorContext.Provider>;
};
