import { atom } from "recoil";

export interface RevisionItemAtomType {
    id: string;
    title: string;
    path: string;
    version: number;
    parent?: string;
    published: boolean;
    locked: boolean;
    savedOn?: Date;
}
export type RevisionsAtomType = RevisionItemAtomType[];
export const revisionsAtom = atom<RevisionsAtomType>({
    key: "revisionsAtom",
    default: []
});
