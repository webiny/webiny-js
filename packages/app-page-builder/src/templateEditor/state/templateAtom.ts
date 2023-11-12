import { atom } from "recoil";
import { PbEditorElement } from "~/types";

export interface PageTemplateWithContent extends PageTemplate {
    content: PbEditorElement;
}

export interface PageTemplate {
    id: string;
    title?: string;
    slug?: string;
    tags?: string[];
    description?: string;
    layout?: string;
    pageCategory?: string;
    dynamicSource?: { modelId?: string; entryId?: string };
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
