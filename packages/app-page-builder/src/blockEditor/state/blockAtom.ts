import { atom } from "recoil";
import { File, PbEditorElement } from "~/types";

export interface BlockWithContent extends BlockAtomType {
    content: PbEditorElement;
}

export interface BlockAtomType {
    id: string;
    name?: string;
    blockCategory?: string;
    preview?: File;
    savedOn?: Date;
    createdBy: {
        id: string | null;
    };
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
