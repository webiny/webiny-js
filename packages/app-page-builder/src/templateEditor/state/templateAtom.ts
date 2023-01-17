import { atom } from "recoil";
import { PbEditorElement } from "~/types";

export interface TemplateWithContent extends TemplateAtomType {
    content: PbEditorElement;
}

export interface TemplateAtomType {
    id: string;
    title?: string;
    description?: string;
    savedOn?: string;
    createdBy: {
        id: string | null;
    };
}

export const templateAtom = atom<TemplateAtomType>({
    key: "templateAtom",
    default: {
        id: "",
        createdBy: {
            id: null
        }
    }
});
