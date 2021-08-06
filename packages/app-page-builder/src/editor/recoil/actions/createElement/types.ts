import { EventActionCallable, PbEditorElement } from "../../../../types";

export type CreateElementEventActionArgsType = {
    element: PbEditorElement;
    source: PbEditorElement;
};
export type CreateElementEventActionCallable =
    EventActionCallable<CreateElementEventActionArgsType>;
