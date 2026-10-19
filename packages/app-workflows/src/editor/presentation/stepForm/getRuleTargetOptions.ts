import type { PickerOption } from "~/components/picker/PickerOption.js";
import { PICKER_UNKNOWN_ITEM_LABEL } from "~/components/picker/pickerTexts.js";
import type { WorkflowUserSummary } from "~/editor/domain/types.js";
import type { RuleTargetValue } from "~/editor/model/assignment/RuleTargetValue.js";
import { ASSIGNMENT_FORM_MESSAGES } from "./assignmentFormMessages.js";
import { getUnresolvedReferenceOption } from "./getUnresolvedReferenceOption.js";
import type { StepFormReferencesOptions } from "./StepFormOptions.js";
import type { StepFormTargetMembersOptions } from "./StepFormOptions.js";
import { toReferencePickerOption } from "./toReferencePickerOption.js";
import { toRuleTargetOptionId } from "./toRuleTargetOptionId.js";
import { toUserPickerOption } from "./toUserPickerOption.js";

export interface RuleTargetOptionsParams {
    // The ids of the reviewing teams as the form holds them now.
    stepTeamIds: string[];
    teamNames: ReadonlyMap<string, string>;
    members: StepFormTargetMembersOptions;
    target: RuleTargetValue | null;
    references: StepFormReferencesOptions;
}

export interface RuleTargetOptions {
    // The pools of the reviewing teams, then the members found by the last search.
    options: PickerOption[];
    // The option the picker shows for the saved target; null for none or for an id nobody knows.
    selected: PickerOption | null;
}

function toPoolOption(teamId: string, teamNames: ReadonlyMap<string, string>): PickerOption {
    let name = teamNames.get(teamId);
    if (name === undefined) {
        name = PICKER_UNKNOWN_ITEM_LABEL;
    }
    return {
        id: toRuleTargetOptionId({ type: "team", id: teamId }),
        label: ASSIGNMENT_FORM_MESSAGES.teamPool(name),
        description: null,
        warning: null,
        muted: false,
        disabled: false,
        icon: "groups",
        note: null
    };
}

function toMemberOption(
    user: WorkflowUserSummary,
    teamNames: ReadonlyMap<string, string>
): PickerOption {
    const option = toUserPickerOption(user, teamNames);
    return { ...option, id: toRuleTargetOptionId({ type: "user", id: user.id }) };
}

function isInSomeTeam(teamIds: string[], stepTeamIds: string[]): boolean {
    return teamIds.some(teamId => stepTeamIds.includes(teamId));
}

function toStaleOption(option: PickerOption): PickerOption {
    return { ...option, label: ASSIGNMENT_FORM_MESSAGES.notInReviewingTeams(option.label) };
}

function getSelectedTeamTarget(
    params: RuleTargetOptionsParams,
    target: RuleTargetValue
): PickerOption | null {
    const { stepTeamIds, teamNames, references } = params;
    const optionId = toRuleTargetOptionId(target);
    const label = references.teams.get(target.id);
    // A deleted team is shown as deleted even while its id is still in the step's teams (Q59.1).
    if (label !== undefined && label.state === "deleted") {
        return { ...toReferencePickerOption(label, "team"), id: optionId };
    }
    if (stepTeamIds.includes(target.id)) {
        return toPoolOption(target.id, teamNames);
    }
    if (label === undefined) {
        return getUnresolvedReferenceOption(optionId, references);
    }

    const option = { ...toReferencePickerOption(label, "team"), id: optionId };
    if (label.state === "found") {
        return toStaleOption(option);
    }
    return option;
}

function getSelectedUserTarget(
    params: RuleTargetOptionsParams,
    target: RuleTargetValue
): PickerOption | null {
    const { stepTeamIds, teamNames, members, references } = params;
    const optionId = toRuleTargetOptionId(target);

    const known = [...members.selected, ...members.items].find(user => user.id === target.id);
    if (known !== undefined) {
        const option = toMemberOption(known, teamNames);
        if (isInSomeTeam(known.teamIds, stepTeamIds)) {
            return option;
        }
        return toStaleOption(option);
    }

    const label = references.users.get(target.id);
    if (label === undefined) {
        return getUnresolvedReferenceOption(optionId, references);
    }

    const option = { ...toReferencePickerOption(label, "user"), id: optionId };
    if (label.state !== "found") {
        return option;
    }

    // A user whose teams are unknown (the lookup failed) is not flagged.
    const teamIds = references.userTeamIds.get(target.id);
    if (teamIds === undefined || isInSomeTeam(teamIds, stepTeamIds)) {
        return option;
    }
    return toStaleOption(option);
}

/*
 * The options of a rule's `Then assign to` picker and the option of its saved target (R307, R298):
 * `{Team} team pool` per reviewing team (value `team:<id>`), then the members of the reviewing
 * teams (value `user:<id>`, sub line = their team names). A saved target is shown as listed, or, when
 * it left the reviewing teams, as `{Name} (not in reviewing teams)`; a deleted user or team is
 * muted (`Deleted user`, `Deleted team`); an unresolved one shows the neutral label until it
 * resolves. The editor shows no exclusion and no read-access note (Q50).
 */
export const getRuleTargetOptions = (params: RuleTargetOptionsParams): RuleTargetOptions => {
    const { stepTeamIds, teamNames, members, target } = params;

    const options: PickerOption[] = [];
    for (const teamId of stepTeamIds) {
        // A deleted team cannot be chosen: its saved target shows as Deleted team.
        if (params.references.teams.get(teamId)?.state === "deleted") {
            continue;
        }
        const pool = toPoolOption(teamId, teamNames);
        options.push(pool);
    }
    for (const user of members.items) {
        const member = toMemberOption(user, teamNames);
        options.push(member);
    }

    let selected: PickerOption | null = null;
    if (target !== null && target.type === "team") {
        selected = getSelectedTeamTarget(params, target);
    }
    if (target !== null && target.type === "user") {
        selected = getSelectedUserTarget(params, target);
    }

    return { options, selected };
};
