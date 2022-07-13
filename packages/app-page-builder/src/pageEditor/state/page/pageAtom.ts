import { atom } from "recoil";
import { PbEditorElement } from "~/types";

interface PageCategoryType {
    slug: string;
    name: string;
    url: string;
}

export interface PageWithContent extends PageAtomType {
    content: PbEditorElement;
}

export interface PageAtomType {
    id: string;
    title?: string;
    pid?: string;
    path: string;
    status: string;
    settings?: {
        general?: {
            layout?: string;
        };
    };
    parent?: string;
    version: number;
    locked: boolean;
    published: boolean;
    savedOn?: Date;
    snippet: string | null;
    category?: PageCategoryType;
    createdBy: {
        id: string | null;
    };
}

export const pageAtom = atom<PageAtomType>({
    key: "pageAtom",
    default: {
        id: "",
        locked: false,
        version: 1,
        published: false,
        snippet: null,
        createdBy: {
            id: null
        },
        path: "",
        status: ""
    }
});
