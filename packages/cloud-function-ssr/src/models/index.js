import { flow } from "lodash";
import { withStorage } from "@webiny/commodo";
import ssrCache from "./ssrCache.model";
import { withId, DbProxyDriver } from "@webiny/commodo-fields-storage-db-proxy";

export default ({ options, context }) => {
    const createBase = () =>
        flow(
            withId(),
            withStorage({
                driver: new DbProxyDriver({ dbProxyFunctionName: process.env.DB_PROXY_FUNCTION })
            })
        )();

    const SsrCache = ssrCache({ createBase, options });
    const models = {
        SsrCache
    };

    context.plugins.byType("extend-models").forEach(plugin => {
        plugin.extend(models);
    });

    return models;

};
