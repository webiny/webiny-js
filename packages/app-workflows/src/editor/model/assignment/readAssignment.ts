import { createRuleId } from "~/editor/model/createRuleId.js";
import { isRecord } from "~/editor/model/isRecord.js";
import { ASSIGNMENT_STRATEGIES } from "./AssignmentStrategy.js";
import type { AssignmentStrategy } from "./AssignmentStrategy.js";
import type { AssignmentValue } from "./AssignmentValue.js";
import type { RuleFolderValue } from "./RuleFolderValue.js";
import type { RuleTargetValue } from "./RuleTargetValue.js";
import type { RuleValue } from "./RuleValue.js";

const KNOWN_ASSIGNMENT_KEYS = ["strategy", "allowManualPick", "rules"];
const KNOWN_RULE_KEYS = ["id", "conditions", "target"];
const KNOWN_CONDITION_KEYS = ["requesterUserId", "requesterTeamId", "folder"];

function isAssignmentStrategy(value: unknown): value is AssignmentStrategy {
    return ASSIGNMENT_STRATEGIES.some(strategy => strategy === value);
}

function isNonEmptyString(value: unknown): value is string {
    return typeof value === "string" && value !== "";
}

function copyUnknownKeys(
    source: Record<string, unknown>,
    knownKeys: string[]
): Record<string, unknown> {
    const copy: Record<string, unknown> = {};
    for (const key of Object.keys(source)) {
        if (!knownKeys.includes(key)) {
            copy[key] = source[key];
        }
    }
    return copy;
}

function readFolder(value: unknown): RuleFolderValue | null {
    if (!isRecord(value)) {
        return null;
    }
    const { id, type, includeDescendants } = value;
    if (!isNonEmptyString(id) || !isNonEmptyString(type)) {
        return null;
    }
    if (typeof includeDescendants !== "boolean") {
        return null;
    }
    return { id, type, includeDescendants };
}

function readTarget(value: unknown): RuleTargetValue | null {
    if (!isRecord(value)) {
        return null;
    }
    const { type, id } = value;
    if (!isNonEmptyString(id)) {
        return null;
    }
    if (type === "user") {
        return { type: "user", id };
    }
    if (type === "team") {
        return { type: "team", id };
    }
    return null;
}

// Reads an optional id condition; a present value that is not a usable id is kept raw in `leftover`.
function readOptionalId(
    source: Record<string, unknown>,
    key: string,
    leftover: Record<string, unknown>
): string | null {
    const value = source[key];
    if (isNonEmptyString(value)) {
        return value;
    }
    if (value !== undefined) {
        leftover[key] = value;
    }
    return null;
}

interface ReadConditions {
    requesterUserId: string | null;
    requesterTeamId: string | null;
    folder: RuleFolderValue | null;
    // Unknown condition keys and malformed editable conditions, kept raw.
    leftover: Record<string, unknown>;
}

function readConditions(value: unknown): ReadConditions {
    const source: Record<string, unknown> = isRecord(value) ? value : {};
    const leftover = copyUnknownKeys(source, KNOWN_CONDITION_KEYS);
    const requesterUserId = readOptionalId(source, "requesterUserId", leftover);
    const requesterTeamId = readOptionalId(source, "requesterTeamId", leftover);
    const folder = readFolder(source.folder);
    if (folder === null && source.folder !== undefined) {
        leftover.folder = source.folder;
    }

    return { requesterUserId, requesterTeamId, folder, leftover };
}

function readRule(source: Record<string, unknown>, id: string): RuleValue {
    const conditions = readConditions(source.conditions);
    const target = readTarget(source.target);
    const preserved = copyUnknownKeys(source, KNOWN_RULE_KEYS);
    if (Object.keys(conditions.leftover).length > 0) {
        preserved.conditions = conditions.leftover;
    }
    if (target === null && source.target !== undefined) {
        preserved.target = source.target;
    }

    return {
        id,
        requesterUserId: conditions.requesterUserId,
        requesterTeamId: conditions.requesterTeamId,
        folder: conditions.folder,
        target,
        preserved
    };
}

// A stored id is kept when it is usable and not seen yet (R314); every other rule gets a new one.
function pickRuleId(source: Record<string, unknown>, seen: Set<string>, taken: string[]): string {
    const stored = source.id;
    if (isNonEmptyString(stored) && !seen.has(stored)) {
        return stored;
    }
    const created = createRuleId(taken);
    taken.push(created);
    return created;
}

function readRules(value: unknown): RuleValue[] {
    if (!Array.isArray(value)) {
        return [];
    }
    const sources = value.filter(isRecord);
    // Every stored id is reserved first, so a generated id never collides with a later rule's id.
    const taken: string[] = [];
    for (const source of sources) {
        if (isNonEmptyString(source.id)) {
            taken.push(source.id);
        }
    }

    const seen = new Set<string>();
    const rules: RuleValue[] = [];
    for (const source of sources) {
        const id = pickRuleId(source, seen, taken);
        seen.add(id);
        const rule = readRule(source, id);
        rules.push(rule);
    }
    return rules;
}

/*
 * Parses the stored assignment object (`readReviewConfig(...).assignment`) into the typed value
 * (R293, R295, R314). `null` (a step without an assignment) reads as the review defaults. Nothing
 * the editor does not edit is dropped: `assignmentToConfig` writes it back.
 */
export const readAssignment = (assignment: Record<string, unknown> | null): AssignmentValue => {
    if (assignment === null) {
        return { strategy: "none", allowManualPick: false, rules: [], preserved: {} };
    }

    const preserved = copyUnknownKeys(assignment, KNOWN_ASSIGNMENT_KEYS);
    const stored = assignment.strategy;
    let strategy: AssignmentStrategy | null = null;
    if (isAssignmentStrategy(stored)) {
        strategy = stored;
    } else if (stored !== undefined) {
        preserved.strategy = stored;
    }

    return {
        strategy,
        allowManualPick: assignment.allowManualPick === true,
        rules: readRules(assignment.rules),
        preserved
    };
};
