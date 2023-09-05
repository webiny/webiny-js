import { CmsGroup } from "~/types";
import { createGroupCreateValidation } from "~/crud/contentModelGroup/validation";
import { createZodError } from "@webiny/utils";
import { ValidatedCmsGroupResult } from "~/export/types";

interface Params {
    groups: Pick<CmsGroup, "id" | "slug">[];
    input: Partial<CmsGroup>[];
}

export const validateGroups = async (params: Params): Promise<ValidatedCmsGroupResult[]> => {
    const { groups, input } = params;

    const validation = createGroupCreateValidation();

    return await Promise.all(
        input.map(async group => {
            const result = await validation.safeParseAsync(group);
            if (!result.success) {
                const error = createZodError(result.error);
                return {
                    group: group as CmsGroup,
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
                    error: {
                        message: `Group is missing ID.`,
                        code: "GROUP_ID_MISSING"
                    }
                };
            }
            if (!data.slug) {
                return {
                    group: data,
                    error: {
                        message: `Group is missing slug.`,
                        code: "GROUP_SLUG_MISSING"
                    }
                };
            }
            const groupWithIdExists = groups.some(g => g.id === data.id);
            if (groupWithIdExists) {
                return {
                    group: data,
                    error: {
                        message: `Group with ID "${data.id}" already exists.`,
                        code: "GROUP_ID_EXISTS"
                    }
                };
            }
            const groupWithSlugExists = groups.some(g => g.slug === data.slug);
            if (groupWithSlugExists) {
                return {
                    group: data,
                    error: {
                        message: `Group with slug "${data.slug}" already exists.`,
                        code: "GROUP_SLUG_EXISTS"
                    }
                };
            }

            return {
                group: data
            };
        })
    );
};
