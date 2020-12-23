import { connectedAtom } from "@webiny/app-page-builder/editor/recoil/modules/connected";

export type RevisionItemAtomType = {
    id: string;
    title: string;
    path: string;
    version: number;
    parent?: string;
    published: boolean;
    locked: boolean;
    savedOn?: Date;
};
export type RevisionsAtomType = RevisionItemAtomType[];
export const revisionsAtom = connectedAtom<RevisionsAtomType>({
    key: "revisionsAtom",
    default: []
});
