import { CmsContext } from "~/types";
import { CmsGroupImportResult, ValidCmsGroupResult } from "~/export/types";

interface Params {
    context: CmsContext;
    groups: ValidCmsGroupResult[];
}

export const importGroups = async (params: Params) => {
    const { context, groups } = params;

    const existingGroups = await context.security.withoutAuthorization(async () => {
        return context.cms.listGroups();
    });

    const results: CmsGroupImportResult[] = [];
    for (const group of groups) {
        const existingGroup = existingGroups.find(g => {
            return g.slug === group.group.slug || g.id === group.group.id;
        });
        if (existingGroup) {
            results.push({
                group: group.group,
                imported: false,
                error: {
                    message: `Group already exists.`,
                    code: "GROUP_EXISTS",
                    data: {
                        existing: existingGroup
                    }
                }
            });
            continue;
        }

        try {
            const result = await context.cms.createGroup(group.group);
            results.push({
                group: {
                    ...result
                },
                imported: true
            });
        } catch (ex) {
            results.push({
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
