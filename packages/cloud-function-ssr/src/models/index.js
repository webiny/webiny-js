import { flow } from "lodash";
import { withStorage } from "@webiny/commodo";
import ssrCache from "./ssrCache.model";
import { withId, DbProxyDriver } from "@webiny/commodo-fields-storage-db-proxy";

export default options => {
    const createBase = () =>
        flow(
            withId(),
            withStorage({
                driver: new DbProxyDriver({ dbProxyFunctionName: process.env.DB_PROXY_FUNCTION })
            })
        )();

    const SsrCache = ssrCache({ createBase, options });

    return {
        SsrCache
    };
};
