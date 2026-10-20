import type { AssignmentStrategy } from "~/editor/model/assignment/AssignmentStrategy.js";
import type { RuleValue } from "~/editor/model/assignment/RuleValue.js";

/*
 * Everything a Test routing result depends on (R300): the step's teams, strategy, pick toggle and
 * rules, and the test's requester and folder. Nothing else about the step belongs here, so nothing
 * else can make a result stale. `strategy` is `null` for an unknown stored strategy (R314).
 */
export interface TestRoutingInput {
    stepId: string;
    teams: string[];
    strategy: AssignmentStrategy | null;
    allowManualPick: boolean;
    rules: RuleValue[];
    requesterId: string | null;
    folderId: string | null;
}
