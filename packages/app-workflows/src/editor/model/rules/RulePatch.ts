import type { RuleFolderValue } from "~/editor/model/assignment/RuleFolderValue.js";
import type { RuleTargetValue } from "~/editor/model/assignment/RuleTargetValue.js";

/*
 * The keys of a rule the editor edits. A key that is `undefined` leaves the rule's value alone;
 * `null` clears it. The id and the preserved data are never patched.
 */
export interface RulePatch {
    requesterUserId?: string | null;
    requesterTeamId?: string | null;
    folder?: RuleFolderValue | null;
    target?: RuleTargetValue | null;
}
