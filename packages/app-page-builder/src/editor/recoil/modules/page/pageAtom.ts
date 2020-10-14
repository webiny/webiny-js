import { atom } from "recoil";
import { PbElement } from "@webiny/app-page-builder/types";

type PageCategoryType = {
    id: string;
    name: string;
    url: string;
};

export type PageAtomType = {
    id?: string;
    title?: string;
    url?: string;
    content?: PbElement;
    settings?: {
        general?: {
            layout?: string;
        };
    };
    parent?: string;
    version: number;
    elements: PbElement[];
    locked: boolean;
    published: boolean;
    isHomePage: boolean;
    isErrorPage: boolean;
    isNotFoundPage: boolean;
    savedOn?: Date;
    snippet: string | null;
    category?: PageCategoryType;
};
export const pageAtom = atom<PageAtomType>({
    key: "pageAtom",
    default: {
        elements: [],
        locked: false,
        version: 1,
        published: false,
        isHomePage: false,
        isErrorPage: false,
        isNotFoundPage: false,
        snippet: null
    }
});
