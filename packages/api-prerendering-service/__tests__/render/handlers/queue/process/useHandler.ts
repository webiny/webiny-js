import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { createHandler } from "@webiny/handler";
import dbPlugins from "@webiny/handler-db";
import { DynamoDbDriver } from "@webiny/db-dynamodb";
import queueProcessPlugins from "@webiny/api-prerendering-service/queue/process";
import handlerClient from "@webiny/handler-client";
import { getStorageOperations } from "../../../../storageOperations";

const defaults = {
    db: {
        table: "PrerenderingService",
        keys: [
            {
                primary: true,
                unique: true,
                name: "primary",
                fields: [{ name: "PK" }, { name: "SK" }]
            }
        ]
    }
};

export default (...plugins) => {
    const dynamoDbDriver = new DynamoDbDriver({
        documentClient: new DocumentClient({
            convertEmptyValues: true,
            endpoint: process.env.MOCK_DYNAMODB_ENDPOINT,
            sslEnabled: false,
            region: "local"
        })
    });

    const storageOperations = getStorageOperations();

    const handler = createHandler(
        ...plugins,
        handlerClient(),
        queueProcessPlugins({
            handlers: {
                render: "handler-client-handler-render-handler",
                flush: "handler-client-handler-flush-handler"
            }
        }),
        dbPlugins({
            table: "PrerenderingService",
            driver: dynamoDbDriver
        })
    );

    return { handler, dynamoDbDriver, defaults, storageOperations };
};
