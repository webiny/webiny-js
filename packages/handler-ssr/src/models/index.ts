/*
import { withStorage } from "@commodo/fields-storage";
import { pipe } from "@commodo/pipe";
import ssrCache from "./ssrCache.model";
import { withId, DbProxyDriver } from "no-exist";
import { HandlerContextPlugin } from "@webiny/handler/types";
import { HandlerClientContext } from "@webiny/handler-client/types";

export default (options): HandlerContextPlugin<HandlerClientContext> => ({
    type: "context",
    name: "context-models",
    apply(context) {
        const createBase = () =>
            pipe(
                withId(),
                withStorage({
                    driver: new DbProxyDriver({
                        dbProxyFunction: process.env.DB_PROXY_FUNCTION,
                        context
                    })
                })
            )();

        const SsrCache = ssrCache({ createBase, options, context });
        context.models = {
            SsrCache
        };
    }
});
*/
