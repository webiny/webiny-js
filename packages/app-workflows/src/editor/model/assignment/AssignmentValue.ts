import type { AssignmentStrategy } from "./AssignmentStrategy.js";
import type { RuleValue } from "./RuleValue.js";
import type { UnreadRule } from "./UnreadRule.js";

export interface AssignmentValue {
    // `null` when the stored strategy is none of the three (R314): the raw value is in `preserved.strategy` until the admin picks one.
    strategy: AssignmentStrategy | null;
    allowManualPick: boolean;
    rules: RuleValue[];
    // Unknown assignment keys, written back unchanged. `rules` holds a stored value that is not a list.
    preserved: Record<string, unknown>;
    // The entries of the stored rule list that are not objects, written back at their position.
    unreadRules?: UnreadRule[];
}
