import type { RoutingRuleConditions } from "~/domain/workflow/types.js";
import type { RoutingRuleFacts } from "./types.js";

/**
 * Whether every condition of a rule holds (spec 6, R113). Pure. A rule without conditions
 * matches. A folder condition needs a target folder of the same type: with `includeDescendants`
 * it matches when the rule folder is the target folder or one of its ancestors, otherwise only
 * the target folder itself. A target in the root matches no folder condition.
 */
export const matchRoutingRuleConditions = (
    conditions: RoutingRuleConditions,
    facts: RoutingRuleFacts
): boolean => {
    if (conditions.requesterUserId && conditions.requesterUserId !== facts.requesterId) {
        return false;
    }
    if (
        conditions.requesterTeamId &&
        !facts.requesterTeamIds.includes(conditions.requesterTeamId)
    ) {
        return false;
    }
    if (conditions.modelId && conditions.modelId !== facts.modelId) {
        return false;
    }
    const folder = conditions.folder;
    if (folder) {
        if (!facts.folder || folder.type !== facts.folder.type) {
            return false;
        }
        const isTargetFolder = folder.id === facts.folder.id;
        const matches = folder.includeDescendants
            ? isTargetFolder || facts.folderChainIds.includes(folder.id)
            : isTargetFolder;
        if (!matches) {
            return false;
        }
    }
    return true;
};
