import { EventActionCallable } from "~/types";
import { PageAtomType, TemplateModeAtomType } from "~/pageEditor/state";

export interface PageEditorEventActionCallableState {
    page: PageAtomType;
    isTemplateMode: TemplateModeAtomType;
}

export type PageEventActionCallable<TArgs> = EventActionCallable<
    TArgs,
    PageEditorEventActionCallableState
>;
