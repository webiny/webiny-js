import { atom } from "recoil";

interface PageCategoryType {
    slug: string;
    name: string;
    url: string;
}

export interface PageAtomType {
    id?: string;
    title?: string;
    pid?: string;
    path?: string;
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
        id: string;
    };
}

export const pageAtom = atom<PageAtomType>({
    key: "pageAtom",
    default: {
        locked: false,
        version: 1,
        published: false,
        snippet: null,
        createdBy: {
            id: null
        },
        status: null
    }
});
