import { atom } from "recoil";

export interface BlockCategoryAtomType {
    name: string;
    slug: string;
    savedOn?: Date;
    createdBy: {
        id: string | null;
    };
}

export type BlockCategoriesAtomType = BlockCategoryAtomType[];
export const blockCategoriesAtom = atom<BlockCategoriesAtomType>({
    key: "blockCategoriesAtom",
    default: []
});
