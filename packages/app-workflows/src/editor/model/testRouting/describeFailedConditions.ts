import type { RoutingCondition } from "~/editor/domain/types.js";
import type { RuleValue } from "~/editor/model/assignment/RuleValue.js";
import type { ReferenceLabel } from "~/editor/model/rules/ReferenceLabel.js";
import type { RuleReferences } from "~/editor/model/rules/RuleReferences.js";

const UNKNOWN_ITEM = "Unknown item";

function getLabel(map: ReadonlyMap<string, ReferenceLabel>, id: string): string {
    const reference = map.get(id);
    return reference === undefined ? UNKNOWN_ITEM : reference.label;
}

function describeFolderCondition(rule: RuleValue, references: RuleReferences): string | null {
    if (rule.folder === null) {
        return null;
    }
    const reference = references.folders.get(rule.folder.id);
    let path = UNKNOWN_ITEM;
    if (reference !== undefined) {
        path = reference.label;
    }
    if (reference !== undefined && reference.state === "restricted") {
        path = "the restricted folder";
    }
    const subfolders = rule.folder.includeDescendants ? " or its subfolders" : "";

    return `content is not in ${path}${subfolders}`;
}

function describeCondition(
    condition: RoutingCondition,
    rule: RuleValue,
    references: RuleReferences
): string | null {
    if (condition === "requesterUser" && rule.requesterUserId !== null) {
        const name = getLabel(references.users, rule.requesterUserId);
        return `requester is not ${name}`;
    }
    if (condition === "requesterTeam" && rule.requesterTeamId !== null) {
        const name = getLabel(references.teams, rule.requesterTeamId);
        return `requester is not in ${name}`;
    }
    if (condition === "folder") {
        return describeFolderCondition(rule, references);
    }
    return null;
}

/*
 * The failed conditions of a not matched rule as one capitalised sentence (R301): `Requester is not
 * Ivan Horvat and content is not in /Campaigns or its subfolders.` Empty when no named condition
 * can be described (none failed, or the rule has no such condition).
 */
export const describeFailedConditions = (
    failed: RoutingCondition[],
    rule: RuleValue,
    references: RuleReferences
): string => {
    const parts: string[] = [];
    for (const condition of failed) {
        const part = describeCondition(condition, rule, references);
        if (part !== null) {
            parts.push(part);
        }
    }
    if (parts.length === 0) {
        return "";
    }

    const sentence = parts.join(" and ");
    return `${sentence.charAt(0).toUpperCase()}${sentence.slice(1)}.`;
};
