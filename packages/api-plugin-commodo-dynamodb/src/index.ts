import { DynamoDbDriver } from "@commodo/fields-storage-dynamodb";
import { ContextPlugin } from "@webiny/graphql/types";

// @see https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/node-reusing-connections.html
process.env.AWS_NODEJS_CONNECTION_REUSE_ENABLED = "1";

export default options => {
    return [
        {
            name: "context-commodo",
            type: "context",
            apply(context) {
                if (!context.commodo) {
                    context.commodo = {
                        driver: new DynamoDbDriver(options)
                    };
                }
            }
        } as ContextPlugin
    ];
};
