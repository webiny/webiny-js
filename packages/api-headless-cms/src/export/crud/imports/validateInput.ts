import type { CmsGroup, CmsModel } from "~/types/index.js";
import type {
    CmsImportStructureParamsData,
    ValidatedCmsGroupResult,
    ValidatedCmsModelResult
} from "~/export/types.js";
import { validateGroups } from "~/export/crud/imports/validateGroups.js";
import { validateModels } from "~/export/crud/imports/validateModels.js";

interface Params {
    groups: CmsGroup[];
    models: CmsModel[];
    data: CmsImportStructureParamsData;
}

interface ValidResponse {
    groups: ValidatedCmsGroupResult[];
    models: ValidatedCmsModelResult[];
    error?: never;
}

interface InvalidResponse {
    groups: ValidatedCmsGroupResult[];
    models: ValidatedCmsModelResult[];
    error?: string;
}

interface InputGroup extends Pick<CmsGroup, "id" | "slug"> {
    target: string;
}

export const validateInput = async (params: Params): Promise<ValidResponse | InvalidResponse> => {
    const { groups, models, data } = params;

    const validatedGroups = await validateGroups({
        groups,
        input: data.groups
    });

    const inputGroups = validatedGroups.reduce<InputGroup[]>(
        (collection, data) => {
            if (!data.group?.id) {
                return collection;
            }
            collection.push({
                id: data.group.id,
                target: data.target || data.group.id,
                slug: data.group.slug
            });
            return collection;
        },
        groups.map(g => {
            return {
                id: g.id,
                target: g.id,
                slug: g.slug
            };
        })
    );
    const validatedModels = await validateModels({
        groups: inputGroups,
        models,
        input: data.models.map(model => {
            let groupSlug = "ungrouped";
            // v6 export
            if (typeof model.group === "string") {
                groupSlug = model.group;
            } else if (model.group && "id" in model.group) {
                // @ts-expect-error v5 export has `group` as an object, not a string.
                const group = inputGroups.find(g => g.id === model.group.id);
                if (group) {
                    groupSlug = group.slug;
                }
            }
            return { ...model, group: groupSlug };
        })
    });
    if (validatedModels.length === 0) {
        return {
            groups: validatedGroups,
            models: validatedModels,
            error: "No models to import."
        };
    }
    return {
        groups: validatedGroups,
        models: validatedModels
    };
};
