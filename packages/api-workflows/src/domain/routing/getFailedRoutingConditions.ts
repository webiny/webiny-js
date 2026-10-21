import type { RoutingRuleConditions } from "~/domain/workflow/types.js";
import type { RoutingCondition, RoutingRuleFacts } from "./types.js";

/**
 * The conditions of a rule that do not hold, in the order requester, requester's team, folder
 * (R289). Pure; the facts must carry the requester's teams and the folder chain, so the inspector
 * reads them for every rule it explains. A failed `modelId` condition names nothing here: it
 * fails the rule (`matchRoutingRuleConditions`) but the editor has no such condition. The folder
 * rules are those of `matchRoutingRuleConditions`: a target in the root or of another type
 * fails, the target folder matches, and with `includeDescendants` so do its ancestors.
 */
export const getFailedRoutingConditions = (
    conditions: RoutingRuleConditions,
    facts: RoutingRuleFacts
): RoutingCondition[] => {
    const failed: RoutingCondition[] = [];
    if (conditions.requesterUserId && conditions.requesterUserId !== facts.requesterId) {
        failed.push("requesterUser");
    }
    if (
        conditions.requesterTeamId &&
        !facts.requesterTeamIds.includes(conditions.requesterTeamId)
    ) {
        failed.push("requesterTeam");
    }
    const folder = conditions.folder;
    if (folder) {
        if (!facts.folder || folder.type !== facts.folder.type) {
            failed.push("folder");
        } else {
            const isTargetFolder = folder.id === facts.folder.id;
            const inChain = folder.includeDescendants && facts.folderChainIds.includes(folder.id);
            if (!isTargetFolder && !inChain) {
                failed.push("folder");
            }
        }
    }
    return failed;
};
