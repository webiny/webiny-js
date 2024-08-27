import { EventActionCallable, EventActionHandlerCallableArgs } from "~/types";
import { PageAtomType } from "~/pageEditor/state";
import { TemplateModeAtomType } from "~/pageEditor/hooks/useTemplateMode";

export interface PageEditorEventActionCallableState {
    page: PageAtomType;
    isTemplateMode: TemplateModeAtomType;
}

export type PageEventActionCallable<TArgs extends EventActionHandlerCallableArgs = any> =
    EventActionCallable<TArgs, PageEditorEventActionCallableState>;
