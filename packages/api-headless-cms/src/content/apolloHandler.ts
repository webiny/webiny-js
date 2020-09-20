import { CreateApolloHandlerPlugin } from "@webiny/handler-apollo-server/types";
import createApolloHandler from "./apolloHandler/createApolloHandler";

const handlers = {};

const plugin: CreateApolloHandlerPlugin = {
    name: "handler-apollo-server-create-handler",
    type: "handler-apollo-server-create-handler",
    async create({ context, options }) {
        const http = context.http;

        const { key = "" } = http.path || {};
        const [type = null, environment = null] = key.split("/");
        const id = `${type}:${environment}`;

        if (!handlers[id]) {
            handlers[id] = await createApolloHandler({ context, options });
            return handlers[id];
        }

        const meta = await handlers[id].queryMeta();
        if (handlers[id].meta.cacheKey === meta.cacheKey) {
            return handlers[id];
        }

        handlers[id] = await createApolloHandler({ context, options, meta });
        return handlers[id];
    }
};

export default plugin;
