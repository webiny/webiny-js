import { Editor } from "@webiny/app-website-builder/editorSdk/Editor.js";
import { WbPageStatus } from "@webiny/app-website-builder/constants.js";
import type { WbStatus } from "@webiny/app-website-builder/constants.js";
import type { IPageEditorDocument } from "~/Components/PageEditor/pageEditorDocument.js";

export const createPageEditor = (
    pageStatus: WbStatus,
    title: string = "Home",
    createdById: string | null = null
): Editor<IPageEditorDocument> => {
    const document: IPageEditorDocument = {
        id: "page-1#0001",
        status: pageStatus,
        version: 1,
        state: {},
        properties: { title },
        extensions: {},
        metadata: {},
        bindings: {},
        elements: {},
        createdBy: createdById ? { id: createdById } : null
    };

    return new Editor<IPageEditorDocument>(document, {
        isReadOnly: pageStatus !== WbPageStatus.Draft
    });
};
