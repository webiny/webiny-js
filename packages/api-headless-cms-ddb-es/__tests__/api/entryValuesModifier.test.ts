/**
 * This file tests the CmsEntryElasticsearchValuesModifier plugin.
 * It enables a developer to modify the values that are sent to Elasticsearch.
 *
 * For example, if you want to send just a title of an article into an Elasticsearch index, you can use this plugin to do so.
 */

import { useHandler } from "~tests/graphql/handler";
import { createMockPlugins } from "~tests/converters/mocks";
import { createEntryRawData } from "~tests/converters/mocks/data";
import { configurations } from "~/configurations";
import {
    createGlobalModifierPlugin,
    createGlobalModifierValues,
    createNotApplicableModifierPlugin,
    createTargetedModifierPlugin,
    createTargetedModifierValues
} from "./mocks/plugins";
import { createExpectedGetResult } from "./mocks/result";
import { fetchFromElasticsearch } from "~tests/api/helpers/fetchFromElasticsearch";

describe("entry values modifier", () => {
    const { index: indexName } = configurations.es({
        model: {
            tenant: "root",
            locale: "en-US",
            modelId: "converter"
        }
    });

    it("should modify the audit log entry values which are stored into the Elasticsearch - global", async () => {
        const { createContext, elasticsearch } = useHandler({
            plugins: [...createMockPlugins(), createGlobalModifierPlugin()]
        });
        const context = await createContext();

        const manager = await context.cms.getEntryManager("converter");

        const createResult = await manager.create(createEntryRawData());

        /**
         * Check that we are getting everything properly out of the DynamoDB
         */
        const getResult = await manager.get(createResult.id);
        expect(getResult).toMatchObject(createExpectedGetResult());
        await elasticsearch.indices.refresh({
            index: indexName
        });
        /**
         * Then check that we are getting everything properly out of the Elasticsearch, via webiny API.
         */
        const [[listResult]] = await manager.listLatest({
            where: {
                id: createResult.id
            }
        });
        expect(listResult.values).toEqual(createGlobalModifierValues());
    });

    it("should modify the audit log entry values which are stored into the Elasticsearch - targeted", async () => {
        const { createContext, elasticsearch } = useHandler({
            plugins: [...createMockPlugins(), createTargetedModifierPlugin()]
        });
        const context = await createContext();

        const manager = await context.cms.getEntryManager("converter");

        const createResult = await manager.create(createEntryRawData());

        /**
         * Check that we are getting everything properly out of the DynamoDB
         */
        const getResult = await manager.get(createResult.id);
        expect(getResult).toMatchObject(createExpectedGetResult());
        await elasticsearch.indices.refresh({
            index: indexName
        });
        /**
         * Then check that we are getting everything properly out of the Elasticsearch, via webiny API.
         */
        const [[listResult]] = await manager.listLatest({
            where: {
                id: createResult.id
            }
        });
        expect(listResult.values).toEqual(createTargetedModifierValues());
    });

    it("should modify the audit log entry values which are stored into the Elasticsearch - not applicable", async () => {
        const { createContext, elasticsearch } = useHandler({
            plugins: [...createMockPlugins(), createNotApplicableModifierPlugin()]
        });
        const context = await createContext();

        const manager = await context.cms.getEntryManager("converter");

        const createResult = await manager.create(createEntryRawData());

        /**
         * Check that we are getting everything properly out of the DynamoDB
         */
        const getResult = await manager.get(createResult.id);
        expect(getResult).toMatchObject(createExpectedGetResult());
        await elasticsearch.indices.refresh({
            index: indexName
        });
        /**
         * Then check that we are getting everything properly out of the Elasticsearch, via webiny API.
         */
        const [[listResult]] = await manager.listLatest({
            where: {
                id: createResult.id
            }
        });
        expect(listResult.values.title).toEqual(createExpectedGetResult().values.title);
    });

    it("should modify the audit log entry values which are stored into the Elasticsearch - targeted, global and not applicable - transform storageId", async () => {
        const { createContext, elasticsearch } = useHandler({
            plugins: [
                ...createMockPlugins(),
                createGlobalModifierPlugin(),
                createTargetedModifierPlugin({
                    inherit: true
                }),
                createNotApplicableModifierPlugin()
            ]
        });
        const context = await createContext();

        const manager = await context.cms.getEntryManager("converter");

        const createResult = await manager.create(createEntryRawData());

        /**
         * Check that we are getting everything properly out of the DynamoDB
         */
        const getResult = await manager.get(createResult.id);
        expect(getResult).toMatchObject(createExpectedGetResult());
        await elasticsearch.indices.refresh({
            index: indexName
        });
        /**
         * Then check that we are getting everything properly out of the Elasticsearch, via webiny API.
         */
        const [[listResult]] = await manager.listLatest({
            where: {
                id: createResult.id
            }
        });
        expect(listResult.values).toEqual({
            ...createGlobalModifierValues(),
            ...createTargetedModifierValues()
        });

        const elasticsearchResult = await fetchFromElasticsearch({
            client: elasticsearch,
            index: indexName
        });
        expect(elasticsearchResult).not.toBe(null);
        expect(elasticsearchResult).not.toBe(undefined);
        expect(elasticsearchResult.values).not.toBe(null);
        expect(elasticsearchResult.values).not.toBe(undefined);

        expect(elasticsearchResult.values).toEqual({
            // from the global plugin
            "number@ageFieldIdWithSomeValue": 25,
            // from targeted plugin
            "text@titleFieldIdWithSomeValue": "A targeted modifier plugin."
        });
    });

    it("should modify the audit log entry values which are stored into the Elasticsearch - targeted, global and not applicable - disable transform storageId", async () => {
        process.env.WEBINY_API_TEST_STORAGE_ID_CONVERSION_DISABLE = "true";
        const { createContext, elasticsearch } = useHandler({
            plugins: [
                ...createMockPlugins(),
                createGlobalModifierPlugin(),
                createTargetedModifierPlugin({
                    inherit: true
                }),
                createNotApplicableModifierPlugin()
            ]
        });
        const context = await createContext();

        const manager = await context.cms.getEntryManager("converter");

        const createResult = await manager.create(createEntryRawData());

        /**
         * Check that we are getting everything properly out of the DynamoDB
         */
        const getResult = await manager.get(createResult.id);
        expect(getResult).toMatchObject(createExpectedGetResult());
        await elasticsearch.indices.refresh({
            index: indexName
        });
        /**
         * Then check that we are getting everything properly out of the Elasticsearch, via webiny API.
         */
        const [[listResult]] = await manager.listLatest({
            where: {
                id: createResult.id
            }
        });
        expect(listResult.values).toEqual({
            ...createGlobalModifierValues(),
            ...createTargetedModifierValues()
        });

        const elasticsearchResult = await fetchFromElasticsearch({
            client: elasticsearch,
            index: indexName
        });
        expect(elasticsearchResult).not.toBe(null);
        expect(elasticsearchResult).not.toBe(undefined);
        expect(elasticsearchResult.values).not.toBe(null);
        expect(elasticsearchResult.values).not.toBe(undefined);

        expect(elasticsearchResult.values).toEqual({
            // from the global plugin
            age: 25,
            // from targeted plugin
            title: "A targeted modifier plugin."
        });
    });
});
