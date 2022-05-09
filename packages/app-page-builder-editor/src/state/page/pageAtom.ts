import { atom } from "recoil";
import { PbEditorElement } from "~/types";

type PageCategoryType = {
    slug: string;
    name: string;
    url: string;
};

export interface PageWithContent extends PageAtomType {
    content: PbEditorElement;
}

export type PageAtomType = {
    id?: string;
    title?: string;
    path?: string;
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
};

export const pageAtom = atom<PageAtomType>({
    key: "v2.pageAtom",
    default: {
        locked: false,
        version: 1,
        published: false,
        snippet: null,
        createdBy: {
            id: null
        }
    }
});
