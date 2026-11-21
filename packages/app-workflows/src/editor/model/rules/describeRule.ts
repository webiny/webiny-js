import { hasPreservedConditions } from "~/editor/model/assignment/hasPreservedConditions.js";
import type { RuleFolderValue } from "~/editor/model/assignment/RuleFolderValue.js";
import type { RuleTargetValue } from "~/editor/model/assignment/RuleTargetValue.js";
import type { RuleValue } from "~/editor/model/assignment/RuleValue.js";
import { isTargetOutsideTeams } from "./isTargetOutsideTeams.js";
import type { ReferenceLabel } from "./ReferenceLabel.js";
import type { RuleReferences } from "./RuleReferences.js";

const UNKNOWN_ITEM = "Unknown item";

function getLabel(map: ReadonlyMap<string, ReferenceLabel>, id: string): string {
    const reference = map.get(id);
    return reference === undefined ? UNKNOWN_ITEM : reference.label;
}

function describeFolder(folder: RuleFolderValue, references: RuleReferences): string {
    const reference = references.folders.get(folder.id);
    let text = UNKNOWN_ITEM;
    if (reference !== undefined) {
        text = reference.label;
    }
    if (reference !== undefined && reference.state === "deleted") {
        text = "a deleted folder";
    }
    if (reference !== undefined && reference.state === "restricted") {
        text = "a restricted folder";
    }
    const subfolders = folder.includeDescendants ? " (incl. subfolders)" : "";

    return `content is in ${text}${subfolders}`;
}

function describeConditions(rule: RuleValue, references: RuleReferences): string[] {
    const conditions: string[] = [];
    if (rule.requesterUserId !== null) {
        const name = getLabel(references.users, rule.requesterUserId);
        conditions.push(`requester is ${name}`);
    }
    if (rule.requesterTeamId !== null) {
        const name = getLabel(references.teams, rule.requesterTeamId);
        conditions.push(`requester is in ${name}`);
    }
    if (rule.folder !== null) {
        const folder = describeFolder(rule.folder, references);
        conditions.push(folder);
    }
    return conditions;
}

function describeTarget(
    target: RuleTargetValue | null,
    references: RuleReferences,
    stepTeamIds: string[] | undefined
): string {
    if (target === null) {
        return "(no target)";
    }
    let text = `${getLabel(references.teams, target.id)} team pool`;
    if (target.type === "user") {
        text = getLabel(references.users, target.id);
    }
    // The same mark as the target picker's label (R307).
    if (stepTeamIds !== undefined && isTargetOutsideTeams(target, stepTeamIds, references)) {
        return `${text} (not in reviewing teams)`;
    }
    return text;
}

function describePrefix(rule: RuleValue, conditions: string[]): string {
    const hasOthers = hasPreservedConditions(rule);
    if (conditions.length > 0) {
        const others = hasOthers ? " and other conditions" : "";
        return `If ${conditions.join(" and ")}${others}`;
    }
    if (hasOthers) {
        return "If other conditions match";
    }
    return "Always";
}

/*
 * The one-line summary of a rule (the design's `ruleSummary`, R313): `If requester is in Marketing
 * and content is in /Campaigns (incl. subfolders) → Ivan Horvat`, or `Always → Legal team pool`.
 * The clause for conditions the editor cannot show is copy gap 11. With `stepTeamIds`, a target
 * outside the reviewing teams is marked `(not in reviewing teams)`, as the target picker shows it.
 */
export const describeRule = (
    rule: RuleValue,
    references: RuleReferences,
    stepTeamIds?: string[]
): string => {
    const conditions = describeConditions(rule, references);
    const prefix = describePrefix(rule, conditions);
    const target = describeTarget(rule.target, references, stepTeamIds);

    return `${prefix} → ${target}`;
};
