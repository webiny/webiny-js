import { connectedAtom } from "@webiny/app-page-builder/editor/recoil/modules/connected";

type PageCategoryType = {
    slug: string;
    name: string;
    url: string;
};

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
        id: string;
    };
};

export const pageAtom = connectedAtom<PageAtomType>({
    key: "pageAtom",
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
