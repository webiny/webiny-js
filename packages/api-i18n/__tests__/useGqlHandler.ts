import { createHandler } from "@webiny/handler-aws";
import graphqlHandler from "@webiny/handler-graphql";
import i18nPlugins from "../src/graphql";
import tenancyPlugins from "@webiny/api-tenancy";
import securityPlugins from "@webiny/api-security";
const { DocumentClient } = require("aws-sdk/clients/dynamodb");
import { createStorageOperations as tenancyStorageOperations } from "@webiny/api-tenancy-so-ddb";
import { createStorageOperations as securityStorageOperations } from "@webiny/api-security-so-ddb";
import { apiCallsFactory } from "./helpers";
import { SecurityIdentity, SecurityPermission } from "@webiny/api-security/types";
import { customAuthenticator } from "./mocks/customAuthenticator";
import { customAuthorizer } from "./mocks/customAuthorizer";

type UseGqlHandlerParams = {
    permissions?: SecurityPermission[];
    identity?: SecurityIdentity;
    plugins?: any;
};
// IMPORTANT: This must be removed from here in favor of a dynamic SO setup.
const documentClient = new DocumentClient({
    convertEmptyValues: true,
    endpoint: process.env.MOCK_DYNAMODB_ENDPOINT || "http://localhost:8001",
    sslEnabled: false,
    region: "local",
    accessKeyId: "test",
    secretAccessKey: "test"
});

export default (params: UseGqlHandlerParams = {}) => {
    const { plugins: extraPlugins } = params;
    // @ts-ignore
    if (typeof __getStorageOperationsPlugins !== "function") {
        throw new Error(`There is no global "__getStorageOperationsPlugins" function.`);
    }
    // @ts-ignore
    const storageOperations = __getStorageOperationsPlugins();
    if (typeof storageOperations !== "function") {
        throw new Error(
            `A product of "__getStorageOperationsPlugins" must be a function to initialize storage operations.`
        );
    }
    // Creates the actual handler. Feel free to add additional plugins if needed.
    const handler = createHandler(
        storageOperations(),
        tenancyPlugins({
            storageOperations: tenancyStorageOperations({ documentClient, table: process.env.DB_TABLE })
        }),
        securityPlugins({
            storageOperations: securityStorageOperations({ documentClient, table: process.env.DB_TABLE })
        }),
        customAuthenticator(),
        customAuthorizer(),
        graphqlHandler(),
        {
            type: "context",
            apply(context) {
                context.tenancy.getCurrentTenant = () => {
                    return { id: "root", name: "Root", parent: null };
                };
            }
        },
        i18nPlugins(),
        extraPlugins || []
    );

    // Let's also create the "invoke" function. This will make handler invocations in actual tests easier and nicer.
    const invoke = async ({ httpMethod = "POST", body, headers = {}, ...rest }) => {
        const response = await handler({
            httpMethod,
            headers,
            body: JSON.stringify(body),
            ...rest
        });

        // The first element is the response body, and the second is the raw response.
        return [JSON.parse(response.body), response];
    };

    return {
        handler,
        invoke,
        ...apiCallsFactory(invoke)
    };
};
