import type { WebsocketsRoute } from "~/types.js";
import type { WebsocketsRouteHandler } from "~/features/Routes/abstractions.js";

const DEFAULT: WebsocketsRoute = "default";

export const websocketsRouteDefault: WebsocketsRouteHandler.Interface = {
    route: DEFAULT,
    async run({ response, getIdentity, getTenant }) {
        const tenant = getTenant();
        const identity = getIdentity();
        if (!tenant) {
            return response.error({
                message: "Missing tenant."
            });
        } else if (!identity) {
            return response.error({
                message: "Missing identity."
            });
        }

        return response.ok();
    }
};
