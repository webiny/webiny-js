import { createModifyFastifyPlugin } from "~/plugins/ModifyFastifyPlugin";
import { DummyCache } from "./DummyCache";
import { hash } from "./hash";

export const createCachingPlugin = (cache: DummyCache) => {
    return createModifyFastifyPlugin(app => {
        /**
         * When receiving a request, we check if we have a response in cache.
         */
        app.addHook("preValidation", async (request, reply) => {
            const key = hash(request.body);
            const value = await cache.read(key);
            if (!value) {
                return;
            }
            return reply.status(200).header("x-using-cache", true).send(value.value).hijack();
        });
        /**
         * When sending a response, we store the response in cache.
         */
        app.addHook("onSend", async (request, reply, payload: string) => {
            if (
                reply.statusCode !== 200 ||
                reply.getHeader("x-using-cache") ||
                request.method !== "POST"
            ) {
                return;
            }

            const key = hash(request.body);
            await cache.store(key, {
                body: request.body,
                payload
            });
        });
    });
};
