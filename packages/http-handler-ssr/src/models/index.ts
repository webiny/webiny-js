import flow from "lodash.flow";
import { withStorage } from "@webiny/commodo/fields-storage";
import ssrCache from "./ssrCache.model";
import { withId, DbProxyDriver } from "@webiny/commodo-fields-storage-db-proxy";
import { HttpContextPlugin } from "@webiny/http-handler/types";

export default (options): HttpContextPlugin => ({
    type: "context",
    name: "context-models",
    apply({ context }) {
        const createBase = () =>
            flow(
                withId(),
                withStorage({
                    driver: new DbProxyDriver({
                        dbProxyFunctionName: process.env.DB_PROXY_FUNCTION
                    })
                })
            )();

        const SsrCache = ssrCache({ createBase, options });
        context.models = {
            SsrCache
        };
    }
});
