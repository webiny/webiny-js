import { connectedAtom } from "@webiny/app-page-builder/editor/recoil/modules/connected";

type PageCategoryType = {
    id: string;
    name: string;
    url: string;
};

export type PageAtomType = {
    id?: string;
    title?: string;
    url?: string;
    settings?: {
        general?: {
            layout?: string;
        };
    };
    parent?: string;
    version: number;
    locked: boolean;
    published: boolean;
    isHomePage: boolean;
    isErrorPage: boolean;
    isNotFoundPage: boolean;
    savedOn?: Date;
    snippet: string | null;
    category?: PageCategoryType;
};
export const pageAtom = connectedAtom<PageAtomType>({
    key: "pageAtom",
    default: {
        locked: false,
        version: 1,
        published: false,
        isHomePage: false,
        isErrorPage: false,
        isNotFoundPage: false,
        snippet: null
    }
});
