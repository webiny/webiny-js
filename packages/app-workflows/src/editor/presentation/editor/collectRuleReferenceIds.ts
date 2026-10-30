import { StepTypeId } from "~/editor/domain/StepTypeId.js";
import type { AutomationDefinition } from "~/editor/domain/types.js";
import type { EditorStep } from "~/editor/domain/types.js";
import { readAssignment } from "~/editor/model/assignment/readAssignment.js";
import type { RuleValue } from "~/editor/model/assignment/RuleValue.js";
import { getUserSettingKeys } from "~/editor/model/getUserSettingKeys.js";
import { readAutomationConfig } from "~/editor/model/readAutomationConfig.js";
import { readReviewConfig } from "~/editor/model/readReviewConfig.js";
import type { RuleReferenceIds } from "./RuleReferenceIds.js";

function addUnique(list: string[], id: string | null): void {
    if (id !== null && id !== "" && !list.includes(id)) {
        list.push(id);
    }
}

function addRule(ids: RuleReferenceIds, rule: RuleValue): void {
    addUnique(ids.userIds, rule.requesterUserId);
    addUnique(ids.teamIds, rule.requesterTeamId);

    const target = rule.target;
    if (target !== null && target.type === "user") {
        addUnique(ids.userIds, target.id);
    }
    if (target !== null && target.type === "team") {
        addUnique(ids.teamIds, target.id);
    }

    const folder = rule.folder;
    if (folder !== null && !ids.folders.some(item => item.id === folder.id)) {
        ids.folders.push({ id: folder.id, type: folder.type });
    }
}

// A `ui: "user"` setting holds one user id; its keys come from the step's definition (R271, R285).
function addAutomationUsers(
    ids: RuleReferenceIds,
    step: EditorStep,
    automations: AutomationDefinition[]
): void {
    const config = readAutomationConfig(step.config);
    const definition = automations.find(item => item.id === config.automationId);
    if (!definition) {
        return;
    }
    for (const key of getUserSettingKeys(definition.settingsSchema)) {
        const value = config.settings[key];
        if (typeof value === "string") {
            addUnique(ids.userIds, value);
        }
    }
}

/*
 * The users, teams and folders the rules of every People step reference, and the users of the
 * `ui: "user"` settings of the Automation steps, distinct and in step and rule order (R298). A
 * People step of an unavailable `review` row is not resolved (teams off, R290); an Automation step
 * does not depend on teams. The steps' own teams stay on the 9a path.
 */
export const collectRuleReferenceIds = (
    steps: EditorStep[],
    reviewAvailable: boolean,
    automations: AutomationDefinition[]
): RuleReferenceIds => {
    const ids: RuleReferenceIds = { userIds: [], teamIds: [], folders: [] };
    for (const step of steps) {
        if (step.type === StepTypeId.Automation) {
            addAutomationUsers(ids, step, automations);
        }
        if (step.type !== StepTypeId.Review || !reviewAvailable) {
            continue;
        }
        const config = readReviewConfig(step.config);
        const assignment = readAssignment(config.assignment);
        for (const rule of assignment.rules) {
            addRule(ids, rule);
        }
    }
    return ids;
};
