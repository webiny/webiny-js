import type { AssignmentStrategy } from "~/editor/model/assignment/AssignmentStrategy.js";
import type { RuleValue } from "~/editor/model/assignment/RuleValue.js";
import type { RuleReferences } from "~/editor/model/rules/RuleReferences.js";

// The names the editor looked up for the ids of an inspection (Task 14c): users by id, teams by id.
export interface InspectionNames {
    users: ReadonlyMap<string, string>;
    teams: ReadonlyMap<string, string>;
}

/*
 * What the composer needs besides the inspection. `rules` are the rules of the request the
 * inspection answers, never the current ones, so a stale result keeps its numbering (R300).
 * `strategy` is the request's strategy; the sentences use the server's own `inspection.strategy`.
 */
export interface TestRoutingContext {
    rules: RuleValue[];
    strategy: AssignmentStrategy | null;
    references: RuleReferences;
    names: InspectionNames;
    // The step's reviewing teams. Optional: with exactly one the pool sentence names it (`No rule matched; waits in the {Team} team pool.`), otherwise it is the plain `team pool` variant.
    stepTeamIds?: string[];
}
