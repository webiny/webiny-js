import { DynamoDbDriver } from "@commodo/fields-storage-dynamodb";
import { ContextPlugin } from "@webiny/graphql/types";

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
