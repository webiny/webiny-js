import { EventActionCallable } from "~/types";
import { PageTemplate } from "~/templateEditor/state";

export interface TemplateEditorEventActionCallableState {
    template: PageTemplate;
}

export type TemplateEventActionCallable<TArgs> = EventActionCallable<
    TArgs,
    TemplateEditorEventActionCallableState
>;
