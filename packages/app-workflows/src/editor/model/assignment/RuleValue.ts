import type { RuleFolderValue } from "./RuleFolderValue.js";
import type { RuleTargetValue } from "./RuleTargetValue.js";

/*
 * A routing rule as the editor holds it (R295). Plain JSON: the form value of the rule list is an
 * array of these, so it never holds a class instance or a React node.
 *
 * `preserved` carries what the editor does not edit and writes back unchanged: `conditions` holds
 * the unknown condition keys (`modelId` and any other, plus a malformed editable condition kept
 * raw), `target` holds a target of an unknown type, every other key is an unknown rule key.
 */
export interface RuleValue {
    id: string;
    requesterUserId: string | null;
    requesterTeamId: string | null;
    folder: RuleFolderValue | null;
    target: RuleTargetValue | null;
    preserved: Record<string, unknown>;
}
