import { createHandler } from "~/fastify";
import { DummyCache } from "./caching/DummyCache";
import { createCachingPlugin } from "./caching/cachePlugin";
import { createPostRoute } from "./caching/createPostRoute";
import { createRequestBody, createRequestBodyValue } from "./caching/requestBody";

describe("request caching", () => {
    it("should store the request response", async () => {
        const cache = new DummyCache();
        const app = createHandler({
            plugins: [createPostRoute(), createCachingPlugin(cache)]
        });

        const result = await app.inject(createRequestBody());
        expect(result).toMatchObject({
            statusCode: 200,
            body: JSON.stringify({
                aResponseValue: 1
            })
        });
        const values = await cache.getData();

        const value = Object.values(values).shift();
        expect(value!.reads).toEqual(0);
        expect(value!.value.body).toEqual(createRequestBodyValue());
        expect(value!.value.payload).toEqual(JSON.stringify({ aResponseValue: 1 }));
    });

    it("should retrieve the request response from cache", async () => {
        const cache = new DummyCache();
        /**
         * First request.
         */
        const firstRequestApp = createHandler({
            plugins: [createPostRoute(), createCachingPlugin(cache)]
        });
        const firstRequestResponse = await firstRequestApp.inject(createRequestBody());
        expect(firstRequestResponse).toMatchObject({
            statusCode: 200,
            body: JSON.stringify({
                aResponseValue: 1
            })
        });

        const firstCacheValues = await cache.getData();

        const firstCacheValue = Object.values(firstCacheValues).shift();
        expect(firstCacheValue!.reads).toEqual(0);
        expect(firstCacheValue!.value.body).toEqual(createRequestBodyValue());
        expect(firstCacheValue!.value.payload).toEqual(JSON.stringify({ aResponseValue: 1 }));
        /**
         * Second request.
         * In the second request we return whole cache data item.
         */
        const secondRequestApp = createHandler({
            plugins: [createPostRoute(), createCachingPlugin(cache)]
        });
        const secondRequestResponse = await secondRequestApp.inject(createRequestBody());
        /**
         * To check that everything is ok, we need to compare the request body value and stringified payload value - and stringify it all together again.
         * This is only to make sure that the cache is working as expected.
         */
        expect(secondRequestResponse).toMatchObject({
            statusCode: 200,
            body: JSON.stringify({
                body: createRequestBodyValue(),
                payload: JSON.stringify({
                    aResponseValue: 1
                })
            })
        });

        const secondCacheValues = await cache.getData();

        const secondCacheValue = Object.values(secondCacheValues).shift();
        expect(secondCacheValue!.reads).toEqual(1);
        expect(secondCacheValue!.value.payload).toEqual(JSON.stringify({ aResponseValue: 1 }));

        /**
         * A third request, goes to the first request app.
         */
        const thirdRequestResponse = await firstRequestApp.inject(createRequestBody());
        expect(thirdRequestResponse).toMatchObject({
            statusCode: 200,
            body: JSON.stringify({
                body: createRequestBodyValue(),
                payload: JSON.stringify({
                    aResponseValue: 1
                })
            })
        });

        const thirdCacheValues = await cache.getData();

        const thirdCacheValue = Object.values(thirdCacheValues).shift();
        expect(thirdCacheValue!.reads).toEqual(2);
        expect(thirdCacheValue!.value.body).toEqual(createRequestBodyValue());
        expect(thirdCacheValue!.value.payload).toEqual(JSON.stringify({ aResponseValue: 1 }));
    });
});
