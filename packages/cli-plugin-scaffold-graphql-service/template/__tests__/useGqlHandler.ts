import { createHandler } from "@webiny/handler-aws";
import dbPlugins from "@webiny/handler-db";
import { DynamoDbDriver } from "@webiny/db-dynamodb";
import securityPlugins from "@webiny/api-security/authenticator";
// uncomment if you want to use in tests
// import apiKeyAuthentication from "@webiny/api-security-tenancy/authentication/apiKey";
// import apiKeyAuthorization from "@webiny/api-security-tenancy/authorization/apiKey";
import { SecurityIdentity } from "@webiny/api-security";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import targetPlugin from "../src/index";
import graphqlPlugins from "@webiny/handler-graphql";
import { simulateStream } from "@webiny/project-utils/testing/dynamodb";

/**
 * The "useGqlHandler" is a simple handler that reflects the one created in "api/code/graphql/src/index.ts". The only
 * difference is that here we use a couple of things. For example, instead of a real "DynamoDb",
 * we use "Dynalite" (https://github.com/mhart/dynalite).
 */

interface UntilOptions {
    name?: string;
    tries?: number;
    wait?: number;
}

export const until = async (
    execute: any,
    until: (value: any) => boolean,
    options: UntilOptions = {}
) => {
    const { name = "NO_NAME", tries = 10, wait = 300 } = options;

    let result;
    let triesCount = 0;

    while (true) {
        result = await execute();

        let done;
        try {
            done = await until(result);
        } catch {}

        if (done) {
            return result;
        }

        triesCount++;
        if (triesCount === tries) {
            break;
        }

        // Wait.
        await new Promise((resolve: any) => {
            setTimeout(() => resolve(), wait);
        });
    }

    throw new Error(
        `[${name}] Tried ${tries} times but failed. Last result that was received: ${JSON.stringify(
            result,
            null,
            2
        )}`
    );
};

/**
 * Dummy tenant definition.
 */
const tenant = {
    id: "root",
    name: "Root",
    parent: null
};
/**
 * Dummy context definition.
 */
const dummyContext: any = {
    security: {
        getTenant: () => tenant
    }
};

export default () => {
    /**
     * The DynamoDB client.
     */
    const documentClient = new DocumentClient({
        convertEmptyValues: true,
        endpoint: process.env.MOCK_DYNAMODB_ENDPOINT,
        sslEnabled: false,
        region: "local"
    });

    /**
     * Creates the actual handler. Feel free to add additional plugins if needed.
     */
    const handler = createHandler(
        /**
         * Plugins which are initializing GraphQL server.
         */
        graphqlPlugins(),
        /**
         * Initialization of the `db` on the context.
         */
        dbPlugins({
            table: "TargetTable",
            driver: new DynamoDbDriver({
                documentClient
            })
        }),
        /**
         * Tenant simulation.
         */
        {
            type: "context",
            name: "context-security-tenant",
            apply(context) {
                if (!context.security) {
                    context.security = {};
                }
                context.security.getTenant = () => {
                    return tenant;
                };
            }
        },
        /**
         * Add all the security plugins.
         */
        securityPlugins(),
        /**
         * Authentication via the api key.
         * Uncomment if you want to use.
         */
        // apiKeyAuthentication({ identityType: "api-key" }),
        // apiKeyAuthorization({ identityType: "api-key" }),
        /**
         * User simulation.
         */
        {
            type: "security-authentication",
            authenticate: async () => {
                return new SecurityIdentity({
                    id: "123",
                    displayName: "User 123",
                    type: "admin"
                });
            }
        },
        /**
         * Your target plugin, so we can test the GraphQL API calls on it.
         */
        targetPlugin()
    );

    /**
     * Let's also create the "invoke" function. This will make handler invocations in actual tests easier and nicer.
     */
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
        until
    };
};
