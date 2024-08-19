import { EventActionCallable, EventActionHandlerCallableArgs } from "~/types";
import { PageTemplate } from "~/templateEditor/state";

export interface TemplateEditorEventActionCallableState {
    template: PageTemplate;
}

export type TemplateEventActionCallable<TArgs extends EventActionHandlerCallableArgs = any> =
    EventActionCallable<TArgs, TemplateEditorEventActionCallableState>;
