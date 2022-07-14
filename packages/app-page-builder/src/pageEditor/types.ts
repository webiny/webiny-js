import { EventActionCallable } from "~/types";
import { PageAtomType } from "~/pageEditor/state";

export interface PageEditorEventActionCallableState {
    page: PageAtomType;
}

export type PageEventActionCallable<TArgs> = EventActionCallable<
    TArgs,
    PageEditorEventActionCallableState
>;
