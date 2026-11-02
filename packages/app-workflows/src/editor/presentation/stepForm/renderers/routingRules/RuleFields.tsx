import React from "react";
import { Checkbox } from "@webiny/admin-ui";
import { WorkflowPicker } from "~/components/picker/WorkflowPicker.js";
import type { RuleValue } from "~/editor/model/assignment/RuleValue.js";
import type { RulePatch } from "~/editor/model/rules/RulePatch.js";
import { ASSIGNMENT_FORM_MESSAGES } from "../../assignmentFormMessages.js";
import { FolderPickerControl } from "../../components/FolderPickerControl.js";
import { PickerLoadFailed } from "../../components/PickerLoadFailed.js";
import { UserPickerControl } from "../../components/UserPickerControl.js";
import { getReferenceSelection } from "../../getReferenceSelection.js";
import { getRuleTargetOptions } from "../../getRuleTargetOptions.js";
import { getTeamNames } from "../../getTeamNames.js";
import { isRestrictedFolder } from "../../isRestrictedFolder.js";
import { parseRuleTargetOptionId } from "../../parseRuleTargetOptionId.js";
import { toRuleTargetOptionId } from "../../toRuleTargetOptionId.js";
import type { RuleCardOptions } from "./RuleCardOptions.js";
import type { RuleFieldMessages } from "./RuleFieldMessages.js";

export interface RuleFieldsProps {
    rule: RuleValue;
    options: RuleCardOptions;
    messages: RuleFieldMessages;
    readOnly: boolean;
    onChange(patch: RulePatch): void;
    onRemoveFolder(): void;
}

/*
 * The five fields of a rule (design 4.2): requester user, requester team, folder with its
 * subfolders flag, and the target. Each reports its edit as a `RulePatch`; the rule itself is
 * never mutated.
 */
export const RuleFields = (props: RuleFieldsProps) => {
    const { rule, options, messages, readOnly } = props;
    const { assignment, teams, targetMembers, folders, references } = options;
    const teamNames = getTeamNames(teams, references);
    const folderId = rule.folder === null ? null : rule.folder.id;
    const restricted = isRestrictedFolder(folderId, folders, references);

    const handleUserChange = (userId: string | null) => {
        props.onChange({ requesterUserId: userId });
    };

    const handleTeamChange = (teamId: string | null) => {
        props.onChange({ requesterTeamId: teamId });
    };

    const handleFolderChange = (newFolderId: string | null) => {
        if (newFolderId === null) {
            props.onChange({ folder: null });
            return;
        }
        let includeDescendants = false;
        if (rule.folder !== null) {
            includeDescendants = rule.folder.includeDescendants;
        }
        props.onChange({
            folder: { id: newFolderId, type: folders.folderType, includeDescendants }
        });
    };

    const handleSubfoldersChange = (checked: boolean) => {
        if (rule.folder === null) {
            return;
        }
        props.onChange({ folder: { ...rule.folder, includeDescendants: checked } });
    };

    const handleTargetChange = (optionId: string | null) => {
        if (optionId === null) {
            props.onChange({ target: null });
            return;
        }
        const target = parseRuleTargetOptionId(optionId);
        props.onChange({ target });
    };

    let teamPicker: React.ReactNode = null;
    if (teams.failed) {
        teamPicker = (
            <PickerLoadFailed
                label={ASSIGNMENT_FORM_MESSAGES.requesterTeamLabel}
                disabled={readOnly}
                error={messages.requesterTeam}
                onRetry={teams.retry}
            />
        );
    } else {
        const known = [...teams.selected, ...teams.options];
        const selected = getReferenceSelection({
            id: rule.requesterTeamId,
            kind: "team",
            known,
            references
        });
        teamPicker = (
            <WorkflowPicker
                label={ASSIGNMENT_FORM_MESSAGES.requesterTeamLabel}
                placeholder={ASSIGNMENT_FORM_MESSAGES.anyTeam}
                anyLabel={ASSIGNMENT_FORM_MESSAGES.anyTeam}
                value={rule.requesterTeamId}
                selected={selected}
                options={teams.options}
                onSearch={teams.search}
                onChange={handleTeamChange}
                disabled={readOnly}
                error={messages.requesterTeam}
            />
        );
    }

    let targetPicker: React.ReactNode = null;
    if (targetMembers.failed) {
        targetPicker = (
            <PickerLoadFailed
                label={ASSIGNMENT_FORM_MESSAGES.targetLabel}
                required
                disabled={readOnly}
                error={messages.target}
                onRetry={targetMembers.retry}
            />
        );
    } else {
        const targetOptions = getRuleTargetOptions({
            stepTeamIds: assignment.stepTeamIds,
            teamNames,
            members: targetMembers,
            target: rule.target,
            references
        });
        let targetValue: string | null = null;
        if (rule.target !== null) {
            targetValue = toRuleTargetOptionId(rule.target);
        }
        targetPicker = (
            <WorkflowPicker
                label={ASSIGNMENT_FORM_MESSAGES.targetLabel}
                description={ASSIGNMENT_FORM_MESSAGES.targetHint}
                required
                placeholder={ASSIGNMENT_FORM_MESSAGES.targetPlaceholder}
                value={targetValue}
                selected={targetOptions.selected}
                options={targetOptions.options}
                onSearch={query => targetMembers.searchTargetMembers(assignment.stepTeamIds, query)}
                onChange={handleTargetChange}
                disabled={readOnly}
                error={messages.target}
            />
        );
    }

    const includeDescendants = rule.folder !== null && rule.folder.includeDescendants;

    return (
        <div className={"grid grid-cols-2 gap-md"}>
            <UserPickerControl
                label={ASSIGNMENT_FORM_MESSAGES.requesterUserLabel}
                placeholder={ASSIGNMENT_FORM_MESSAGES.anyUser}
                anyLabel={ASSIGNMENT_FORM_MESSAGES.anyUser}
                value={rule.requesterUserId}
                users={options.users}
                references={references}
                teamNames={teamNames}
                disabled={readOnly}
                error={messages.requesterUser}
                onChange={handleUserChange}
            />
            {teamPicker}
            <FolderPickerControl
                label={ASSIGNMENT_FORM_MESSAGES.folderLabel}
                placeholder={ASSIGNMENT_FORM_MESSAGES.anyFolder}
                anyLabel={ASSIGNMENT_FORM_MESSAGES.anyFolder}
                value={folderId}
                folders={folders}
                references={references}
                disabled={readOnly}
                error={messages.folder}
                onRemove={props.onRemoveFolder}
                onChange={handleFolderChange}
            />
            <div className={"flex items-end pb-xs"}>
                <Checkbox
                    id={`${rule.id}-include-subfolders`}
                    label={ASSIGNMENT_FORM_MESSAGES.includeSubfolders}
                    checked={includeDescendants}
                    disabled={readOnly || rule.folder === null || restricted}
                    onChange={handleSubfoldersChange}
                />
            </div>
            <div className={"col-span-2"}>{targetPicker}</div>
        </div>
    );
};
