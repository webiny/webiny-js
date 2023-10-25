import ApolloClient from "apollo-client";
import { CmsGroup, CmsModel } from "@webiny/app-headless-cms-common/types";
import { CMS_EXPORT_STRUCTURE_QUERY } from "./graphql";

interface Params {
    client: ApolloClient<any>;
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
    const result = await client.query({
        query: CMS_EXPORT_STRUCTURE_QUERY,
        variables
    });

    if (result.errors?.length) {
        console.error(result.errors);
        return {
            error: result.errors[0]
        };
    } else if (!result.data?.exportStructure) {
        const message = `There is no object returned from the exportStructure query.`;
        console.error(message);
        return {
            error: {
                message
            }
        };
    }
    const { data, error } = result.data.exportStructure;
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
