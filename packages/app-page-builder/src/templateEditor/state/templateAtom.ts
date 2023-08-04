import { atom } from "recoil";
import { CmsModel } from "@webiny/app-headless-cms/types";
import { PbEditorElement } from "~/types";

export interface PageTemplateWithContent extends PageTemplate {
    content: PbEditorElement;
    modelId?: string;
}

export interface PageTemplate {
    id: string;
    title?: string;
    slug?: string;
    tags?: string[];
    description?: string;
    layout?: string;
    pageCategory?: string;
    sourceModel?: CmsModel;
    templatePageData?: { modelId?: string; entryId?: string };
    savedOn?: string;
    createdBy: {
        id: string | null;
    };
}

export const templateAtom = atom<PageTemplate>({
    key: "templateAtom",
    default: {
        id: "",
        createdBy: {
            id: null
        }
    }
});
