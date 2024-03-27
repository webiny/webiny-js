import { getIntrospectionQuery } from "graphql";
import { createHandler } from "@webiny/handler-aws";
import { PluginsContainer } from "@webiny/plugins/types";
import { createHandlerCore, CreateHandlerCoreParams } from "./plugins";
import { APIGatewayEvent, LambdaContext } from "@webiny/handler-aws/types";
import { defaultIdentity } from "./tenancySecurity";
import {
    GET_LOCK_RECORD_QUERY,
    IGetLockRecordGraphQlResponse,
    IGetLockRecordGraphQlVariables,
    IIsEntryLockedGraphQlResponse,
    IIsEntryLockedGraphQlVariables,
    ILockEntryGraphQlResponse,
    ILockEntryGraphQlVariables,
    IS_ENTRY_LOCKED_QUERY,
    IUnlockEntryGraphQlResponse,
    IUnlockEntryGraphQlVariables,
    IUnlockEntryRequestGraphQlResponse,
    IUnlockEntryRequestGraphQlVariables,
    LOCK_ENTRY_MUTATION,
    UNLOCK_ENTRY_MUTATION,
    UNLOCK_ENTRY_REQUEST_MUTATION
} from "./graphql/lockingMechanism";

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

    const plugins = new PluginsContainer(core.plugins);

    const handler = createHandler({
        plugins: plugins.all(),
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
            {} as unknown as LambdaContext
        );
        // The first element is the response body, and the second is the raw response.
        return [JSON.parse(response.body || "{}"), response];
    };

    return {
        handler,
        invoke,
        tenant: core.tenant,
        identity: identity || defaultIdentity,
        plugins,
        storageOperations: core.storageOperations,
        async introspect() {
            return invoke({ body: { query: getIntrospectionQuery() } });
        },
        /**
         * Locking Mechanism
         */
        async isEntryLockedQuery(variables: IIsEntryLockedGraphQlVariables) {
            return invoke<IIsEntryLockedGraphQlResponse>({
                body: { query: IS_ENTRY_LOCKED_QUERY, variables }
            });
        },
        async getLockRecordQuery(variables: IGetLockRecordGraphQlVariables) {
            return invoke<IGetLockRecordGraphQlResponse>({
                body: { query: GET_LOCK_RECORD_QUERY, variables }
            });
        },
        async lockEntryMutation(variables: ILockEntryGraphQlVariables) {
            return invoke<ILockEntryGraphQlResponse>({
                body: { query: LOCK_ENTRY_MUTATION, variables }
            });
        },
        async unlockEntryMutation(variables: IUnlockEntryGraphQlVariables) {
            return invoke<IUnlockEntryGraphQlResponse>({
                body: { query: UNLOCK_ENTRY_MUTATION, variables }
            });
        },
        async unlockEntryRequestMutation(variables: IUnlockEntryRequestGraphQlVariables) {
            return invoke<IUnlockEntryRequestGraphQlResponse>({
                body: { query: UNLOCK_ENTRY_REQUEST_MUTATION, variables }
            });
        }
    };
};
