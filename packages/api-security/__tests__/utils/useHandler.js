import { createHandler } from "@webiny/http-handler";

export default plugins => () => {
    return createHandler(plugins, {
        type: "graphql-context",
        name: "mongo-is-id",
        apply(context) {
            context.commodo.isId = value => {
                if (typeof value === "string") {
                    return value.match(new RegExp("^[0-9a-fA-F]{24}$")) !== null;
                }

                return false;
            };
        }
    });
};
