import { EventActionCallable, PbEditorElement } from "@webiny/app-page-builder/types";

export type CreateElementEventActionArgsType = {
    element: PbEditorElement;
    source: PbEditorElement;
};
export type CreateElementEventActionCallable = EventActionCallable<
    CreateElementEventActionArgsType
>;
