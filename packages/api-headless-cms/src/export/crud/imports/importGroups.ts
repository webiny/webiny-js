import type { CmsContext } from "~/types/index.js";
import type { CmsGroupImportResult, ValidCmsGroupResult } from "~/export/types.js";
import { CmsImportAction } from "~/export/types.js";
import { CreateGroupUseCase } from "~/features/contentModelGroup/CreateGroup/index.js";
import { UpdateGroupUseCase } from "~/features/contentModelGroup/UpdateGroup/index.js";

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
            const updateResult = await context.container
                .resolve(UpdateGroupUseCase)
                .execute(group.group.id, {
                    ...group.group,
                    icon: group.group.icon ?? undefined,
                    description: group.group.description || undefined
                });
            if (updateResult.isFail()) {
                const ex = updateResult.error;
                results.push({
                    action: group.action,
                    group: group.group,
                    imported: false,
                    error: {
                        message: ex.message,
                        code: (ex as any).code || "UPDATE_GROUP_ERROR",
                        data: { ...(ex as any).data, group }
                    }
                });
            } else {
                results.push({
                    action: group.action,
                    group: { ...updateResult.value },
                    imported: true
                });
            }
            continue;
        }
        /**
         * Create the group
         */
        const createResult = await context.container
            .resolve(CreateGroupUseCase)
            .execute(group.group);
        if (createResult.isFail()) {
            const ex = createResult.error;
            results.push({
                action: group.action,
                group: group.group,
                imported: false,
                error: {
                    message: ex.message,
                    code: (ex as any).code || "CREATE_GROUP_ERROR",
                    data: { ...(ex as any).data, group }
                }
            });
        } else {
            results.push({
                action: group.action,
                group: { ...createResult.value },
                imported: true
            });
        }
    }

    return results;
};
