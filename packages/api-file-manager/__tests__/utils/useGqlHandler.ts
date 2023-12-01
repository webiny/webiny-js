import { createHandler } from "@webiny/handler-aws";
import { APIGatewayEvent, LambdaContext } from "@webiny/handler-aws/types";
import { until } from "@webiny/project-utils/testing/helpers/until";
import {
    CREATE_FILE,
    CREATE_FILES,
    DELETE_FILE,
    GET_FILE,
    LIST_FILES,
    LIST_TAGS,
    UPDATE_FILE
} from "~tests/graphql/file";
import {
    GET_SETTINGS,
    INSTALL,
    IS_INSTALLED,
    UPDATE_SETTINGS
} from "~tests/graphql/fileManagerSettings";
import { HandlerParams, handlerPlugins } from "./plugins";
import { defaultIdentity } from "~tests/utils/tenancySecurity";

interface InvokeParams {
    httpMethod?: "POST";
    body: {
        query: string;
        variables?: Record<string, any>;
    };
    headers?: Record<string, string>;
}

export default (params: HandlerParams = {}) => {
    // Creates the actual handler. Feel free to add additional plugins if needed.
    const handler = createHandler({
        plugins: handlerPlugins(params)
    });

    // Let's also create the "invoke" function. This will make handler invocations in actual tests easier and nicer.
    const invoke = async ({ httpMethod = "POST", body, headers = {}, ...rest }: InvokeParams) => {
        const response = await handler(
            {
                path: "/graphql",
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
        return [JSON.parse(response.body), response];
    };

    return {
        until,
        handler,
        invoke,
        identity: params.identity || defaultIdentity,
        // Files
        async createFile(variables: Record<string, any>, fields: string[] = []) {
            return invoke({ body: { query: CREATE_FILE(fields), variables } });
        },
        async updateFile(variables: Record<string, any>, fields: string[] = []) {
            return invoke({ body: { query: UPDATE_FILE(fields), variables } });
        },
        async createFiles(variables: Record<string, any>, fields: string[] = []) {
            return invoke({ body: { query: CREATE_FILES(fields), variables } });
        },
        async deleteFile(variables: Record<string, any>) {
            return invoke({ body: { query: DELETE_FILE, variables } });
        },
        async getFile(variables: Record<string, any>, fields: string[] = []) {
            return invoke({ body: { query: GET_FILE(fields), variables } });
        },
        async listFiles(variables = {}, fields: string[] = []) {
            return invoke({ body: { query: LIST_FILES(fields), variables } });
        },
        async listTags(variables = {}) {
            return invoke({ body: { query: LIST_TAGS, variables } });
        },
        // File Manager settings
        async isInstalled(variables: Record<string, any>) {
            return invoke({ body: { query: IS_INSTALLED, variables } });
        },
        async install(variables = {}) {
            return invoke({ body: { query: INSTALL, variables } });
        },
        async getSettings(variables = {}) {
            return invoke({ body: { query: GET_SETTINGS, variables } });
        },
        async updateSettings(variables: Record<string, any>) {
            return invoke({ body: { query: UPDATE_SETTINGS, variables } });
        }
    };
};
