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

export const validateInput = async (params: Params): Promise<ValidResponse | InvalidResponse> => {
    const { groups, models, data } = params;

    const validatedGroups = await validateGroups({
        groups,
        input: data.groups
    });

    const ids = validatedGroups
        .map(data => {
            if (!data.group?.id) {
                return null;
            }
            return {
                id: data.group?.id
            };
        })
        .filter(Boolean) as Pick<CmsGroup, "id">[];

    const validatedModels = await validateModels({
        groups: groups.map(g => ({ id: g.id })).concat(ids),
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
