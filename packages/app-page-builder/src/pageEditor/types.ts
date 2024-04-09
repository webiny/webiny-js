import { EventActionCallable } from "~/types";
import { PageAtomType } from "~/pageEditor/state";
import { TemplateModeAtomType } from "~/pageEditor/hooks/useTemplateMode";

export interface PageEditorEventActionCallableState {
    page: PageAtomType;
    isTemplateMode: TemplateModeAtomType;
}

export type PageEventActionCallable<TArgs> = EventActionCallable<
    TArgs,
    PageEditorEventActionCallableState
>;
