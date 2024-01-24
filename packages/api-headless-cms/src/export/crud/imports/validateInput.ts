import { CmsGroup, CmsModel } from "~/types";
import {
    CmsImportStructureParamsData,
    ValidatedCmsGroupResult,
    ValidatedCmsModelResult
} from "~/export/types";
import { validateGroups } from "~/export/crud/imports/validateGroups";
import { validateModels } from "~/export/crud/imports/validateModels";

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
        input: data.models
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
