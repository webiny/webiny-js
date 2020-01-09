import qs from "querystringify";
import { createResponse } from "@webiny/cloud-function";
import mime from "mime-types";
import { parseBody } from "./functions";

const API_ACTION = {
    INVALIDATE_SSR_CACHE_BY_PATH: "invalidateSsrCacheByPath",
    INVALIDATE_SSR_CACHE_BY_TAGS: "invalidateSsrCacheByTags"
};

export default () => ({
    type: "handler",
    name: "handler-ssr-cache-api",
    canHandle({ args }) {
        const [event] = args;
        if (mime.lookup(event.path)) {
            return false;
        }

        if (event.path !== "/" || event.httpMethod !== "POST") {
            return false;
        }

        const body = parseBody(event);
        return (
            body.ssr && Array.isArray(body.ssr) && Object.values(API_ACTION).includes(body.ssr[0])
        );
    },
    async handle({ context, args }) {
        const [event] = args;
        const path = event.path + qs.stringify(event.multiValueQueryStringParameters, true);

        let body = parseBody(event);

        const [action, actionArgs = {}] = body.ssr;

        if (action === API_ACTION.INVALIDATE_SSR_CACHE_BY_TAGS) {
            const { tags } = actionArgs;
            const { SsrCache } = context.models;
            for (let i = 0; i < tags.length; i++) {
                let tag = tags[i];
                let $elemMatch = {};
                if (tag.class) {
                    $elemMatch.class = tag.class;
                }

                if (tag.id) {
                    $elemMatch.id = tag.id;
                }

                const driver = SsrCache.getStorageDriver();
                await driver.getClient().runOperation({
                    collection: driver.getCollectionName(SsrCache),
                    operation: [
                        "update",
                        {
                            cacheTags: { $elemMatch }
                        },
                        { $set: { expiresOn: null } },
                        { multi: true }
                    ]
                });
            }

            return createResponse();
        }

        const { SsrCache } = context.models;
        let ssrCache = await SsrCache.findByPath(actionArgs.path);
        if (!ssrCache) {
            ssrCache = new SsrCache();
            ssrCache.path = path;
            await ssrCache.save();
        }

        breakIf: if (action === API_ACTION.INVALIDATE_SSR_CACHE_BY_PATH) {
            if (actionArgs.expired === true) {
                if (!ssrCache.hasExpired) {
                    break breakIf;
                }
            }

            await ssrCache.invalidate();
            if (actionArgs.refresh) {
                await ssrCache.refresh();
            }
        }

        return createResponse();
    }
});
