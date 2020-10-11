import { NeDbDriver } from "@commodo/fields-storage-nedb";
import { ContextPlugin } from "@webiny/graphql/types";

export default ({ database }) => {
    return [
        {
            name: "context-commodo",
            type: "context",
            apply(context) {
                if (!context.commodo) {
                    context.commodo = {
                        driver: new NeDbDriver({ database })
                    };
                }
            }
        } as ContextPlugin
    ];
};
