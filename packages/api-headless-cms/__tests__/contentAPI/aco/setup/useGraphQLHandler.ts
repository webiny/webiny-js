import { getIntrospectionQuery } from "graphql";
import { createHandler } from "@webiny/handler-aws";
import { createHandlerCore, CreateHandlerCoreParams } from "./plugins";
import { createGroupPlugin, createModelPlugin } from "./model";
import { CmsModel } from "~/types";
import { GET_MODEL_QUERY } from "./graphql/contentModel";
import {
    CREATE_ENTRY_MUTATION,
    CreateEntryInputVariables,
    GET_ENTRY_QUERY,
    GetEntryInputVariables,
    GetEntryResult,
    UPDATE_ENTRY_MUTATION,
    UpdateEntryInputVariables,
    CreateEntryResult,
    UpdateEntryResult,
    UPDATE_ENTRY_LOCATION_MUTATION,
    UpdateEntryLocationVariables,
    UpdateEntryLocationResult,
    ListEntriesInputVariables,
    ListEntriesResult,
    LIST_ENTRIES_QUERY
} from "./graphql/contentEntry";
import { createUpdateLocationGraphQl } from "./updateLocationGraphQlPlugin";
import { LambdaContext } from "@webiny/handler-aws/types";
import { APIGatewayEvent } from "@webiny/handler-aws/types";

export type GraphQLHandlerParams = CreateHandlerCoreParams;

export interface InvokeParams {
    httpMethod?: "POST" | "GET" | "OPTIONS";
    body?: {
        query: string;
        variables?: Record<string, any>;
    };
    headers?: Record<string, string>;
}

export const useGraphQLHandler = (params: GraphQLHandlerParams = {}) => {
    const { identity, path } = params;

    const core = createHandlerCore(params);

    const group = createGroupPlugin();
    const model = createModelPlugin();
    const handler = createHandler({
        plugins: core.plugins.concat([group, model, createUpdateLocationGraphQl()]),
        debug: false
    });

    const invoke = async <T = any>({
        httpMethod = "POST",
        body,
        headers = {},
        ...rest
    }: InvokeParams): Promise<[T, any]> => {
        const response = await handler(
            {
                /**
                 * If no path defined, use /graphql as we want to make request to main api
                 */
                path: path ? `/cms/${path}` : "/graphql",
                httpMethod,
                headers: {
                    ["x-tenant"]: "root",
                    ["Content-Type"]: "application/json",
                    ...headers
                },
                body: JSON.stringify(body),
                ...rest
            } as unknown as APIGatewayEvent,
            {} as LambdaContext
        );
        // The first element is the response body, and the second is the raw response.
        return [JSON.parse(response.body || "{}"), response];
    };

    return {
        handler,
        invoke,
        tenant: core.tenant,
        identity,
        storageOperations: core.storageOperations,
        model: model.contentModel as CmsModel,
        async introspect() {
            return invoke({
                body: {
                    query: getIntrospectionQuery()
                }
            });
        },
        async getContentModelQuery(variables: Record<string, any>) {
            return invoke({
                body: {
                    query: GET_MODEL_QUERY,
                    variables
                }
            });
        },
        async getEntry(variables: GetEntryInputVariables) {
            return invoke<GetEntryResult>({
                body: {
                    query: GET_ENTRY_QUERY,
                    variables
                }
            });
        },
        async listEntries(variables: ListEntriesInputVariables) {
            return invoke<ListEntriesResult>({
                body: {
                    query: LIST_ENTRIES_QUERY,
                    variables
                }
            });
        },
        async createEntry(variables: CreateEntryInputVariables) {
            return invoke<CreateEntryResult>({
                body: {
                    query: CREATE_ENTRY_MUTATION,
                    variables
                }
            });
        },
        async updateEntry(variables: UpdateEntryInputVariables) {
            return invoke<UpdateEntryResult>({
                body: {
                    query: UPDATE_ENTRY_MUTATION,
                    variables
                }
            });
        },
        async updateEntryLocation(variables: UpdateEntryLocationVariables) {
            return invoke<UpdateEntryLocationResult>({
                body: {
                    query: UPDATE_ENTRY_LOCATION_MUTATION,
                    variables
                }
            });
        }
    };
};
