import { createWcpContext, createWcpGraphQL } from "@webiny/api-wcp";
import { createHandler } from "@webiny/handler-aws";
import graphqlHandler from "@webiny/handler-graphql";
import i18nPlugins from "@webiny/api-i18n/graphql";
import i18nDynamoDbStorageOperations from "~/index";
import dynamoDbPlugins from "@webiny/db-dynamodb/plugins";
import { apiCallsFactory } from "../../api-i18n/__tests__/helpers";
import { SecurityIdentity, SecurityPermission } from "@webiny/api-security/types";
import dbPlugins from "@webiny/handler-db";
import { DynamoDbDriver } from "@webiny/db-dynamodb";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { createTenancyAndSecurity } from "./tenancySecurity";

type UseGqlHandlerParams = {
    permissions?: SecurityPermission[];
    identity?: SecurityIdentity;
    plugins?: any;
};
export default (params: UseGqlHandlerParams) => {
    const { plugins: extraPlugins } = params;

    const documentClient = new DocumentClient({
        convertEmptyValues: true,
        endpoint: process.env.MOCK_DYNAMODB_ENDPOINT || "http://localhost:8001",
        sslEnabled: false,
        region: "local",
        accessKeyId: "test",
        secretAccessKey: "test"
    });

    const handler = createHandler(
        createWcpContext(),
        createWcpGraphQL(),
        dbPlugins({
            table: process.env.DB_TABLE,
            driver: new DynamoDbDriver({
                documentClient
            })
        }),
        ...createTenancyAndSecurity(),
        i18nDynamoDbStorageOperations(),
        dynamoDbPlugins(),
        graphqlHandler(),
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
