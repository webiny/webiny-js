import { EventActionCallable } from "~/types";
import { BlockAtomType } from "~/blockEditor/state";

export interface BlockEditorEventActionCallableState {
    block: BlockAtomType;
}

export type BlockEventActionCallable<TArgs> = EventActionCallable<
    TArgs,
    BlockEditorEventActionCallableState
>;
