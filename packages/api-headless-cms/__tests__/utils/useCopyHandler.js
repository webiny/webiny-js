import { createHandler } from "@webiny/http-handler";
import headlessCmsPlugins from "../../src/copyEnvironment";

const createCopyHandler = plugins =>
    createHandler(plugins, headlessCmsPlugins(), {
        type: "context",
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

export default plugins => () => {
    const copyHandler = createCopyHandler(plugins);
    return {
        invoke: async event => {
            return await copyHandler(event);
        }
    };
};
