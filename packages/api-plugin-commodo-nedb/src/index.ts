import { NeDbDriver, id } from "@webiny/commodo-fields-storage-nedb";
import { ContextPlugin } from "@webiny/graphql/types";

export default ({ database }) => {
    return [
        {
            name: "context-commodo",
            type: "context",
            preApply(context) {
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
