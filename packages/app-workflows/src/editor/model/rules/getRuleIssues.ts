import type { RuleTargetValue } from "~/editor/model/assignment/RuleTargetValue.js";
import type { RuleValue } from "~/editor/model/assignment/RuleValue.js";
import type { RuleIssue } from "./RuleIssue.js";
import type { RuleIssueContext } from "./RuleIssueContext.js";

const NO_TARGET = "Choose who this rule assigns to.";
const USER_DELETED = "The assigned user was deleted.";
const TEAM_DELETED = "The team was deleted.";
const FOLDER_DELETED = "The folder no longer exists.";

function getUserTargetMessage(target: RuleTargetValue, context: RuleIssueContext): string | null {
    const reference = context.references.users.get(target.id);
    if (reference === undefined) {
        return null;
    }
    if (reference.state === "deleted") {
        return USER_DELETED;
    }
    // A user whose teams are unknown (the lookup failed) is not flagged.
    const teamIds = context.references.userTeamIds.get(target.id);
    if (teamIds === undefined) {
        return null;
    }
    const isMember = teamIds.some(id => context.stepTeamIds.includes(id));
    if (isMember) {
        return null;
    }
    return `${reference.label} is no longer in the reviewing teams.`;
}

function getTeamTargetMessage(target: RuleTargetValue, context: RuleIssueContext): string | null {
    const reference = context.references.teams.get(target.id);
    if (reference !== undefined && reference.state === "deleted") {
        return TEAM_DELETED;
    }
    if (context.stepTeamIds.includes(target.id)) {
        return null;
    }
    // Without a resolved name the message cannot name the team yet; the server still refuses it.
    if (reference === undefined) {
        return null;
    }
    return `${reference.label} is not a reviewing team.`;
}

function getTargetMessage(rule: RuleValue, context: RuleIssueContext): string | null {
    const target = rule.target;
    if (target === null) {
        return NO_TARGET;
    }
    if (target.type === "user") {
        return getUserTargetMessage(target, context);
    }
    return getTeamTargetMessage(target, context);
}

function createIssue(
    rule: RuleValue,
    index: number,
    kind: RuleIssue["kind"],
    field: RuleIssue["field"],
    message: string
): RuleIssue {
    return { ruleId: rule.id, index, kind, field, message };
}

function getIssuesOfRule(rule: RuleValue, index: number, context: RuleIssueContext): RuleIssue[] {
    const issues: RuleIssue[] = [];

    const targetMessage = getTargetMessage(rule, context);
    if (targetMessage !== null) {
        const targetIssue = createIssue(rule, index, "error", "target", targetMessage);
        issues.push(targetIssue);
    }

    // A deleted requester user has its label only (copy gap 2): no issue.
    if (rule.requesterTeamId !== null) {
        const team = context.references.teams.get(rule.requesterTeamId);
        if (team !== undefined && team.state === "deleted") {
            const teamIssue = createIssue(rule, index, "warning", "requesterTeam", TEAM_DELETED);
            issues.push(teamIssue);
        }
    }

    // A restricted folder has the field hint only (copy gap 1): no issue.
    if (rule.folder !== null) {
        const folder = context.references.folders.get(rule.folder.id);
        if (folder !== undefined && folder.state === "deleted") {
            const folderIssue = createIssue(rule, index, "warning", "folder", FOLDER_DELETED);
            issues.push(folderIssue);
        }
    }

    return issues;
}

/*
 * The issues of a rule list (R299, Q50, Q53, Q59.1). Errors (no target, a user or team target
 * outside the reviewing teams, a deleted user or team target) block Save; warnings (a deleted
 * requester team, a deleted folder) never do. Pure and computed from what is resolved: an
 * unresolved reference, or a user whose teams are unknown, is never flagged.
 */
export const getRuleIssues = (rules: RuleValue[], context: RuleIssueContext): RuleIssue[] => {
    const issues: RuleIssue[] = [];
    rules.forEach((rule, index) => {
        const ruleIssues = getIssuesOfRule(rule, index, context);
        issues.push(...ruleIssues);
    });
    return issues;
};
