import {
    CmsGroupImportResult,
    CmsModelImportResult,
    ValidCmsGroupResult,
    ValidCmsModelResult
} from "~/export/types";
import { CmsContext } from "~/types";

interface Params {
    context: CmsContext;
    groups: ValidCmsGroupResult[];
    models: ValidCmsModelResult[];
}

interface Response {
    groups: CmsGroupImportResult[];
    models: CmsModelImportResult[];
    error?: string;
}

export const importData = async (params: Params): Promise<Response> => {
    const { context } = params;

    const groups: CmsGroupImportResult[] = [];
    const models: CmsModelImportResult[] = [];

    for (const group of params.groups) {
        try {
            const result = await context.cms.createGroup(group.group);
            groups.push({
                group: {
                    ...result
                },
                imported: true
            });
        } catch (ex) {
            groups.push({
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
    const importedGroups = groups.filter(g => g.imported).map(g => g.group);
    if (importedGroups.length === 0) {
        return {
            groups,
            models,
            error: "No groups were imported. Aborting."
        };
    }

    return {
        groups,
        models
    };
};
