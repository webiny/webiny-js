// @flow
import { flow } from "lodash";
import { withStorage, withCrudLogs, withSoftDelete, withFields } from "@webiny/commodo";
import { withId } from "@commodo/fields-storage-mongodb";
import ssrCache from "./ssrCache.model";
import { DbProxyDriver } from "@webiny/commodo-fields-storage-db-proxy";

export default ({ options }) => {
    const createBase = flow(
        withId(),
        withStorage({ driver: new DbProxyDriver() }),
        withSoftDelete(),
        withCrudLogs()
    )();

    const SsrCache = ssrCache({ createBase, context, options });

    return {
        SsrCache
    };
};
