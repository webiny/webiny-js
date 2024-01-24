import { CmsGroup } from "~/types";
import { createGroupCreateValidation } from "~/crud/contentModelGroup/validation";
import { createZodError } from "@webiny/utils";
import { CmsImportAction, ValidatedCmsGroupResult } from "~/export/types";

interface Params {
    groups: Pick<CmsGroup, "id" | "slug" | "isPlugin">[];
    input: Partial<CmsGroup>[];
}

export const validateGroups = async (params: Params): Promise<ValidatedCmsGroupResult[]> => {
    const { groups, input } = params;

    const validation = createGroupCreateValidation();

    return await Promise.all(
        input.map(async (group): Promise<ValidatedCmsGroupResult> => {
            const result = await validation.safeParseAsync(group);
            if (!result.success) {
                const error = createZodError(result.error);
                return {
                    group: group as CmsGroup,
                    action: CmsImportAction.NONE,
                    error: {
                        message: error.message,
                        code: error.code,
                        data: error.data
                    }
                };
            }
            const data = result.data as CmsGroup;
            if (!data.id) {
                return {
                    group: data,
                    action: CmsImportAction.NONE,
                    error: {
                        message: `Group is missing ID.`,
                        code: "GROUP_ID_MISSING"
                    }
                };
            }
            if (!data.slug) {
                return {
                    group: data,
                    action: CmsImportAction.NONE,
                    error: {
                        message: `Group is missing slug.`,
                        code: "GROUP_SLUG_MISSING"
                    }
                };
            }

            const isPluginGroup = groups.some(g => {
                if (!g.isPlugin) {
                    return false;
                }
                return g.id === data.id || g.slug === data.slug;
            });
            if (isPluginGroup) {
                return {
                    group: data,
                    action: CmsImportAction.CODE,
                    error: {
                        message: `Group already exists, but it is a plugin group - cannot be updated.`,
                        code: "GROUP_IS_PLUGIN"
                    }
                };
            }

            const canBeUpdated = groups.some(g => {
                return g.id === data.id && g.slug === data.slug;
            });
            if (canBeUpdated) {
                return {
                    group: data,
                    action: CmsImportAction.UPDATE
                };
            }

            const groupWithIdExists = groups.some(g => g.id === data.id);
            if (groupWithIdExists) {
                return {
                    group: data,
                    action: CmsImportAction.NONE,
                    error: {
                        message: `Group with ID "${data.id}" already exists. Cannot update it because the slug is different.`,
                        code: "GROUP_ID_EXISTS"
                    }
                };
            }

            const groupWithSlugExists = groups.find(g => g.slug === data.slug);
            if (groupWithSlugExists) {
                /**
                 * If group with given slug already exists, we will map the ID to the existing group.
                 *
                 * We will also point all models from the imported group to the existing group.
                 * We will not update the existing group.
                 */
                return {
                    group: {
                        ...data,
                        id: groupWithSlugExists.id
                    },
                    target: data.id,
                    action: CmsImportAction.NONE
                };
            }

            return {
                group: data,
                action: CmsImportAction.CREATE
            };
        })
    );
};
