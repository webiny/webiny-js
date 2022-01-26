import { EventActionCallable, PbEditorElement } from "~/types";

export interface CreateElementEventActionArgsType {
    element: PbEditorElement;
    source: PbEditorElement;
}
export type CreateElementEventActionCallable =
    EventActionCallable<CreateElementEventActionArgsType>;
