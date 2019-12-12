// @flow
import { flow } from "lodash";
import { withStorage, withCrudLogs, withSoftDelete, withFields } from "@webiny/commodo";
import { withUser } from "@webiny/api-security";
import ssrCache from "./models/ssrCache.model";
import ssrCacheSettings from "./models/ssrCacheSettings.model";

export default () => ({
    name: "graphql-context-models",
    type: "graphql-context",
    apply(context) {
        const driver = context.commodo && context.commodo.driver;

        if (!driver) {
            throw Error(
                `Commodo driver is not configured! Make sure you add a Commodo driver plugin to your service.`
            );
        }

        const createBase = ({ maxPerPage = 100 } = {}) =>
            flow(
                withFields({
                    id: context.commodo.fields.id()
                }),
                withStorage({ driver, maxPerPage }),
                withUser(context),
                withSoftDelete(),
                withCrudLogs()
            )();

        const SsrCacheSettings = ssrCacheSettings({ createBase, context });
        const SsrCache = ssrCache({ createBase, context, SsrCacheSettings });

        context.models = {
            SsrCacheSettings,
            SsrCache
        };
    }
});
