import {
    CmsGroupImportResult,
    CmsModelImportResult,
    ValidCmsGroupResult,
    ValidCmsModelResult
} from "~/export/types";
import { CmsContext } from "~/types";
import { importGroups } from "./importGroups";
import { importModels } from "./importModels";

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

    const groups = await importGroups(params);

    const importedGroups = groups.filter(g => g.imported).map(g => g.group);

    if (importedGroups.length === 0) {
        return {
            groups,
            models: params.models.map(model => {
                return {
                    ...model,
                    imported: false
                };
            }),
            error: "No groups were imported. Aborting."
        };
    }

    const importModelResults = await importModels({
        context,
        models: params.models
    });

    return {
        groups,
        models: importModelResults
    };
};
