import type { WebsocketsRoute } from "~/types.js";
import type { WebsocketsRouteHandler } from "~/features/Routes/abstractions.js";

const DEFAULT: WebsocketsRoute = "default";

export const websocketsRouteDefault: WebsocketsRouteHandler.Interface = {
    route: DEFAULT,
    async run({ response, identity, getTenant }) {
        const tenant = getTenant();
        if (!tenant) {
            return response.error({
                message: "Missing tenant."
            });
        } else if (identity.isAnonymous()) {
            return response.error({
                message: "Missing identity."
            });
        }

        return response.ok();
    }
};
