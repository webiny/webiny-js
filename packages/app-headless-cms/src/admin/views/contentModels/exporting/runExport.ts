import type { ApolloClient } from "@apollo/client";
import type { CmsGroup, CmsModel } from "@webiny/app-headless-cms-common/types/index.js";
import { CMS_EXPORT_STRUCTURE_QUERY, type ICmsExportStructureResponse } from "./graphql.js";

interface Params {
    client: ApolloClient;
    models?: string[];
}

interface ResponseData {
    groups: CmsGroup[];
    models: CmsModel[];
}

interface Response {
    error?: Partial<Error>;
    data?: ResponseData;
}

export const runExport = async ({ client, models }: Params): Promise<Response> => {
    const variables: Record<string, any> = {};
    if (models?.length) {
        variables.models = models;
    }
    let result: ICmsExportStructureResponse;
    try {
        const response = await client.query<ICmsExportStructureResponse>({
            query: CMS_EXPORT_STRUCTURE_QUERY,
            variables
        });
        if (!response.data?.exportStructure) {
            const message = `There is no data returned from the exportStructure query.`;
            console.error(message);
            return {
                error: {
                    message
                }
            };
        }
        result = response.data;
    } catch (ex) {
        console.error(ex.message);
        return {
            error: ex
        };
    }

    if (!result.exportStructure) {
        const message = `There is no object returned from the exportStructure query.`;
        console.error(message);
        return {
            error: {
                message
            }
        };
    }
    const { data, error } = result.exportStructure;
    if (error) {
        console.error(error.message);
        return {
            error
        };
    } else if (!data) {
        const message = `There is no data returned from the exportStructure query.`;
        return {
            error: {
                message
            }
        };
    }
    try {
        return {
            data: JSON.parse(data)
        };
    } catch (ex) {
        console.error(ex.message);
        return {
            error: ex
        };
    }
};
