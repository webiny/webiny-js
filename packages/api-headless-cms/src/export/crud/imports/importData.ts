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

    const importModelResults = await importModels({
        context,
        models: params.models
    });

    return {
        groups,
        models: importModelResults
    };
};
