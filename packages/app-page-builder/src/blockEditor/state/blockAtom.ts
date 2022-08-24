import { atom } from "recoil";
import { PbEditorElement } from "~/types";

export interface BlockWithContent extends BlockAtomType {
    content: PbEditorElement;
}

export interface BlockAtomType {
    id: string;
    name?: string;
    blockCategory?: string;
    savedOn?: Date;
    createdBy: {
        id: string | null;
    };
    // TODO: add more props here
}

export const blockAtom = atom<BlockAtomType>({
    key: "blockAtom",
    default: {
        id: "",
        createdBy: {
            id: null
        }
    }
});
