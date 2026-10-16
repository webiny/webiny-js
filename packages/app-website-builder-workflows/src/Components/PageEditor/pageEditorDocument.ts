import type { EditorDocument } from "@webiny/app-website-builder/BaseEditor/hooks/useSelectFromDocument.js";
import type { WbStatus } from "@webiny/app-website-builder/constants.js";

export interface IPageEditorDocument extends EditorDocument {
    status: WbStatus;
}

export interface ISelectedPage {
    id: string;
    title: string;
    status: WbStatus;
}
