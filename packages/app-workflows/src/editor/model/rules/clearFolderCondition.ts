import type { RuleValue } from "~/editor/model/assignment/RuleValue.js";

/*
 * The restricted folder's `Remove` (QBZ-15): the folder condition goes, and with it the subfolders
 * flag, which the folder value holds. The rest of the rule stays.
 */
export const clearFolderCondition = (rule: RuleValue): RuleValue => {
    return { ...rule, folder: null };
};
