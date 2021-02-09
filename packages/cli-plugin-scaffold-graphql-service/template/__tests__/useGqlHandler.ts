import { createHandler } from "@webiny/handler";
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

/**
 * The "useGqlHandler" is a simple handler that reflects the one created in "src/index.ts". The only
 * difference is that here we use a couple of different things. For example, instead of a real database
 * driver form Commodo, we use "neDB" driver (https://github.com/louischatriot/nedb/). We also expose
 * a couple of thing that you can use in your tests, like the "database" object and "invoke" function.
 */

const ELASTICSEARCH_PORT = process.env.ELASTICSEARCH_PORT || "9200";

export default () => {
    const documentClient = new DocumentClient({
        convertEmptyValues: true,
        endpoint: process.env.MOCK_DYNAMODB_ENDPOINT,
        sslEnabled: false,
        region: "local"
    });

    // Creates the actual handler. Feel free to add additional plugins if needed.
    const handler = createHandler(
        dbPlugins({
            table: "TargetTable",
            driver: new DynamoDbDriver({
                documentClient
            })
        }),
        elasticSearch({ endpoint: `http://localhost:${ELASTICSEARCH_PORT}` }),
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

    // With the "handler" and "invoke" function, let's also return the "documentClient", which will enable
    // us to do some manual database updating, for example, preparing the initial test data.
    return {
        elasticSearch: new Client({
            node: `http://localhost:${ELASTICSEARCH_PORT}`
        }),
        handler,
        invoke,
        documentClient
    };
};
