import { EventActionCallable, EventActionHandlerCallableArgs } from "~/types";
import { BlockAtomType } from "~/blockEditor/state";

export interface BlockEditorEventActionCallableState {
    block: BlockAtomType;
}

export type BlockEventActionCallable<TArgs extends EventActionHandlerCallableArgs = any> =
    EventActionCallable<TArgs, BlockEditorEventActionCallableState>;
