import type { TargetReviewActionKind } from "./abstractions.js";
import type { TargetReviewActionVm } from "./abstractions.js";

// The actions that live in the overflow menu next to the buttons, on the bar and in the drawer.
const OVERFLOW_KINDS: TargetReviewActionKind[] = ["cancel", "reassign"];

export interface SplitReviewActions {
    buttons: TargetReviewActionVm[];
    menu: TargetReviewActionVm[];
}

// Cancel review and Reassign go into the overflow menu; every other action stays a button.
export const splitReviewActions = (actions: TargetReviewActionVm[]): SplitReviewActions => {
    return {
        buttons: actions.filter(action => !OVERFLOW_KINDS.includes(action.kind)),
        menu: actions.filter(action => OVERFLOW_KINDS.includes(action.kind))
    };
};
