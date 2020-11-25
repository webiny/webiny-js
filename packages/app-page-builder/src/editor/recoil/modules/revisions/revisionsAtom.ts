import { connectedAtom } from "@webiny/app-page-builder/editor/recoil/modules/connected";

export type RevisionItemAtomType = {
    id: string;
    title: string;
    url: string;
    version: number;
    parent?: string;
    published: boolean;
    isHomePage: boolean;
    isErrorPage: boolean;
    isNotFoundPage: boolean;
    locked: boolean;
    savedOn?: Date;
};
export type RevisionsAtomType = RevisionItemAtomType[];
export const revisionsAtom = connectedAtom<RevisionsAtomType>({
    key: "revisionsAtom",
    default: []
});
