import { EventActionCallable } from "~/types";
import { TemplateAtomType } from "~/templateEditor/state";

export interface TemplateEditorEventActionCallableState {
    template: TemplateAtomType;
}

export type TemplateEventActionCallable<TArgs> = EventActionCallable<
    TArgs,
    TemplateEditorEventActionCallableState
>;
