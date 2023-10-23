import { CmsContext } from "~/types";
import { CmsGroupImportResult, CmsImportAction, ValidCmsGroupResult } from "~/export/types";

interface Params {
    context: CmsContext;
    groups: ValidCmsGroupResult[];
}

export const importGroups = async (params: Params) => {
    const { context, groups } = params;

    const results: CmsGroupImportResult[] = [];
    for (const group of groups) {
        if (group.action === CmsImportAction.NONE || group.error) {
            results.push({
                action: group.action,
                group: group.group,
                imported: false,
                error: group.error || {
                    message: "No action to be ran on the group.",
                    code: "NO_ACTION"
                }
            });
        }
        /**
         * Cannot update if the group is created via plugin.
         */
        if (group.action === CmsImportAction.CODE) {
            results.push({
                action: group.action,
                group: group.group,
                imported: true
            });
            continue;
        }
        /**
         * Update the group.
         */
        //
        else if (group.action === CmsImportAction.UPDATE) {
            try {
                const result = await context.cms.updateGroup(group.group.id, {
                    ...group.group,
                    description: group.group.description || undefined
                });
                results.push({
                    action: group.action,
                    group: {
                        ...result
                    },
                    imported: true
                });
            } catch (ex) {
                results.push({
                    action: group.action,
                    group: group.group,
                    imported: false,
                    error: {
                        message: ex.message,
                        code: ex.code || "UPDATE_GROUP_ERROR",
                        data: {
                            ...ex.data,
                            group
                        }
                    }
                });
            }
            continue;
        }
        /**
         * Create the group
         */
        //
        try {
            const result = await context.cms.createGroup(group.group);
            results.push({
                action: group.action,
                group: {
                    ...result
                },
                imported: true
            });
        } catch (ex) {
            results.push({
                action: group.action,
                group: group.group,
                imported: false,
                error: {
                    message: ex.message,
                    code: ex.code || "CREATE_GROUP_ERROR",
                    data: {
                        ...ex.data,
                        group
                    }
                }
            });
        }
    }

    return results;
};
