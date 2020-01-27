import qs from "querystringify";
import { createResponse } from "@webiny/http-handler";
import mime from "mime-types";
import { parseBody } from "./functions";
import { HttpHandlerPlugin } from "@webiny/http-handler/types";

const API_ACTION = {
    INVALIDATE_SSR_CACHE_BY_PATH: "invalidateSsrCacheByPath",
    INVALIDATE_SSR_CACHE_BY_TAGS: "invalidateSsrCacheByTags"
};

export default (): HttpHandlerPlugin => ({
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

        let body = event.body;
        if (event.isBase64Encoded) {
            body = Buffer.from(event.body, "base64").toString("utf-8");
        }

        body = parseBody(body);

        return (
            body.ssr && Array.isArray(body.ssr) && Object.values(API_ACTION).includes(body.ssr[0])
        );
    },
    async handle({ context, args }) {
        const [event] = args;
        const path = event.path + qs.stringify(event.multiValueQueryStringParameters, true);


        let body = event.body;
        if (event.isBase64Encoded) {
            body = Buffer.from(event.body, "base64").toString("utf-8");
        }

        body = parseBody(body);

        const [action, actionArgs = {}] = body.ssr;

        try {
            if (action === API_ACTION.INVALIDATE_SSR_CACHE_BY_TAGS) {
                const { tags } = actionArgs;
                const { SsrCache } = context.models;
                for (let i = 0; i < tags.length; i++) {
                    const tag = tags[i];
                    const $elemMatch: any = {};
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

                return createResponse({
                    type: "text/json",
                    body: JSON.stringify({
                        error: false,
                        data: null
                    })
                });
            }

            const { SsrCache } = context.models;
            let ssrCache = await SsrCache.findByPath(actionArgs.path);
            if (!ssrCache) {
                ssrCache = new SsrCache();
                ssrCache.path = path;
                await ssrCache.save();
            }

            if (action === API_ACTION.INVALIDATE_SSR_CACHE_BY_PATH) {
                const data = {
                    path: ssrCache.path,
                    invalidated: false,
                    refreshed: false,
                    ssrCache: {
                        hasExpired: ssrCache.hasExpired,
                        expiresIn: ssrCache.expiresIn,
                        expiresOn: ssrCache.expiresOn
                    }
                };

                if (actionArgs.expired === true && !ssrCache.hasExpired) {
                    return createResponse({
                        type: "text/json",
                        body: JSON.stringify({
                            error: false,
                            data
                        })
                    });
                }

                await ssrCache.invalidate();
                data.invalidated = true;
                if (actionArgs.refresh) {
                    await ssrCache.refresh();
                    data.refreshed = true;
                }

                data.ssrCache = {
                    hasExpired: ssrCache.hasExpired,
                    expiresIn: ssrCache.expiresIn,
                    expiresOn: ssrCache.expiresOn
                };

                return createResponse({
                    type: "text/json",
                    body: JSON.stringify({
                        error: false,
                        data
                    })
                });
            }

            return createResponse({
                type: "text/json",
                body: JSON.stringify({
                    error: true,
                    data: {
                        message: `Supplied action "${action}" is invalid.`
                    }
                })
            });
        } catch (e) {
            return createResponse({
                type: "text/json",
                body: JSON.stringify({
                    error: true,
                    data: {
                        message: e.message
                    }
                })
            });
        }
    }
});
