import { createHandler } from "@webiny/handler-aws";
import dbPlugins from "@webiny/handler-db";
import { DynamoDbDriver } from "@webiny/db-dynamodb";
import elasticSearch from "@webiny/api-plugin-elastic-search-client";
import securityPlugins from "@webiny/api-security/authenticator";
import apiKeyAuthentication from "@webiny/api-security-tenancy/authentication/apiKey";
import apiKeyAuthorization from "@webiny/api-security-tenancy/authorization/apiKey";
import elasticSearchPlugins from "@webiny/api-headless-cms/content/plugins/es";
import { SecurityIdentity } from "@webiny/api-security";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { Client } from "@elastic/elasticsearch";
import targetPlugin from "../src/index";
import graphqlPlugins from "@webiny/handler-graphql";
import { utils } from "../src/utils";
import { simulateStream } from "@webiny/project-utils/testing/dynamodb";
import dynamoToElastic from "@webiny/api-dynamodb-to-elasticsearch/handler";

/**
 * The "useGqlHandler" is a simple handler that reflects the one created in "api/code/graphql/src/index.ts". The only
 * difference is that here we use a couple of things. For example, instead of a real "DynamoDb",
 * we use "Dynalite" (https://github.com/mhart/dynalite). We also expose
 * a couple of thing that you can use in your tests, like the "elasticSearch" client to access the ES,
 * a function clearElasticsearchIndexes() to run before and after tests to delete the created test indexes,
 * a function until() that helps with waiting for records to propagate into the Elasticesearch.
 * Also, there is invoke() function with which you can call the API.
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

const ELASTICSEARCH_PORT = process.env.ELASTICSEARCH_PORT || "9200";

export default () => {
    const documentClient = new DocumentClient({
        convertEmptyValues: true,
        endpoint: process.env.MOCK_DYNAMODB_ENDPOINT,
        sslEnabled: false,
        region: "local"
    });

    const tenant = {
        id: "root",
        name: "Root",
        parent: null
    };
    const dummyContext: any = {
        security: {
            getTenant: () => tenant
        }
    };

    const elasticSearchContext = elasticSearch({
        endpoint: `http://localhost:${ELASTICSEARCH_PORT}`
    });

    // Intercept DocumentClient operations and trigger dynamoToElastic function (almost like a DynamoDB Stream trigger)
    simulateStream(documentClient, createHandler(elasticSearchContext, dynamoToElastic()));

    // Creates the actual handler. Feel free to add additional plugins if needed.
    const handler = createHandler(
        graphqlPlugins(),
        dbPlugins({
            table: "TargetTable",
            driver: new DynamoDbDriver({
                documentClient
            })
        }),
        elasticSearch({ endpoint: `http://localhost:${ELASTICSEARCH_PORT}` }),
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
        securityPlugins(),
        apiKeyAuthentication({ identityType: "api-key" }),
        apiKeyAuthorization({ identityType: "api-key" }),
        elasticSearchPlugins(),
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
        targetPlugin()
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

    const elasticsearchClient = new Client({
        node: `http://localhost:${ELASTICSEARCH_PORT}`
    });

    const createElasticsearchIndex = async () => {
        return elasticsearchClient.indices.create(utils.es(dummyContext));
    };

    const clearElasticsearchIndexes = async () => {
        return elasticsearchClient.indices.delete({
            index: "_all"
        });
    };

    return {
        elasticSearch: elasticsearchClient,
        handler,
        invoke,
        createElasticsearchIndex,
        clearElasticsearchIndexes,
        until
    };
};
