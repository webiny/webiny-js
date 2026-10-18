import type { AssignmentStrategy } from "./AssignmentStrategy.js";
import type { RuleValue } from "./RuleValue.js";

export interface AssignmentValue {
    // `null` when the stored strategy is none of the three (R314): the raw value is in `preserved.strategy` until the admin picks one.
    strategy: AssignmentStrategy | null;
    allowManualPick: boolean;
    rules: RuleValue[];
    // Unknown assignment keys, written back unchanged.
    preserved: Record<string, unknown>;
}
