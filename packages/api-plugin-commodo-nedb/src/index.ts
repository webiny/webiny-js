import { NeDbDriver, id } from "@commodo/fields-storage-nedb";
import { ContextPlugin } from "@webiny/graphql/types";

export default ({ database }) => {
    return [
        {
            name: "context-commodo",
            type: "context",
            apply(context) {
                if (!context.commodo) {
                    context.commodo = {};
                }

                if (!context.commodo.fields) {
                    context.commodo.fields = {};
                }

                context.commodo.fields.id = id;
                context.commodo.driver = new NeDbDriver({ database });
            }
        } as ContextPlugin
    ];
};
