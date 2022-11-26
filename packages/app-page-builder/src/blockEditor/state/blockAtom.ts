import { atom } from "recoil";
import { FileInput } from "@webiny/app-admin/components/FileManager/graphql";
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
    preview?: { id: string; data: Partial<FileInput> };
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
