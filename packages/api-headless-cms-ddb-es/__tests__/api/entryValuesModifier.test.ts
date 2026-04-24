/**
 * This file tests the CmsEntryElasticsearchValuesModifier plugin.
 * It enables a developer to modify the values that are sent to Elasticsearch.
 *
 * For example, if you want to send just a title of an article into an Elasticsearch index, you can use this plugin to do so.
 */
import { describe, expect, it } from "vitest";
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
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry/index.js";
import { GetEntryByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntryById/index.js";
import { ListLatestEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries/index.js";

describe("entry values modifier", () => {
    const { index: indexName } = configurations.es({
        model: {
            tenant: "root",
            modelId: "converter"
        }
    });

    it("should modify the audit log entry values which are stored into the Elasticsearch - global", async () => {
        const { createContext, elasticsearch } = useHandler({
            plugins: [...createMockPlugins(), createGlobalModifierPlugin()]
        });
        const context = await createContext();

        const getModel = context.container.resolve(GetModelUseCase);
        const createEntry = context.container.resolve(CreateEntryUseCase);
        const getEntry = context.container.resolve(GetEntryByIdUseCase);
        const listLatestEntries = context.container.resolve(ListLatestEntriesUseCase);

        const modelResult = await getModel.execute("converter");
        const model = modelResult.value;

        const createResult = await createEntry.execute(model, {
            values: createEntryRawData()
        });

        /**
         * Check that we are getting everything properly out of the DynamoDB
         */
        const getResult = await getEntry.execute(model, createResult.value.id);
        expect(getResult.value).toMatchObject({
            values: createEntryRawData()
        });
        await elasticsearch.indices.refresh({
            index: indexName
        });
        /**
         * Then check that we are getting everything properly out of the Elasticsearch, via webiny API.
         */
        const listResult = await listLatestEntries.execute(model, {
            where: {
                id: createResult.value.id
            }
        });
        const { entries: listValues } = listResult.value;
        expect(listValues[0].values).toEqual(createGlobalModifierValues());
    });

    it("should modify the audit log entry values which are stored into the Elasticsearch - targeted", async () => {
        const { createContext, elasticsearch } = useHandler({
            plugins: [...createMockPlugins(), createTargetedModifierPlugin()]
        });
        const context = await createContext();

        const getModel = context.container.resolve(GetModelUseCase);
        const createEntry = context.container.resolve(CreateEntryUseCase);
        const getEntry = context.container.resolve(GetEntryByIdUseCase);
        const listLatestEntries = context.container.resolve(ListLatestEntriesUseCase);

        const modelResult = await getModel.execute("converter");
        const model = modelResult.value;

        const createResult = await createEntry.execute(model, {
            values: createEntryRawData()
        });

        /**
         * Check that we are getting everything properly out of the DynamoDB
         */
        const getResult = await getEntry.execute(model, createResult.value.id);
        expect(getResult.value).toMatchObject({
            values: createEntryRawData()
        });
        await elasticsearch.indices.refresh({
            index: indexName
        });
        /**
         * Then check that we are getting everything properly out of the Elasticsearch, via webiny API.
         */
        const listResult = await listLatestEntries.execute(model, {
            where: {
                id: createResult.value.id
            }
        });
        const { entries: listValue } = listResult.value;
        expect(listValue[0].values).toEqual(createTargetedModifierValues());
    });

    it("should modify the audit log entry values which are stored into the Elasticsearch - not applicable", async () => {
        const { createContext, elasticsearch } = useHandler({
            plugins: [...createMockPlugins(), createNotApplicableModifierPlugin()]
        });
        const context = await createContext();

        const getModel = context.container.resolve(GetModelUseCase);
        const createEntry = context.container.resolve(CreateEntryUseCase);
        const getEntry = context.container.resolve(GetEntryByIdUseCase);
        const listLatestEntries = context.container.resolve(ListLatestEntriesUseCase);

        const modelResult = await getModel.execute("converter");
        const model = modelResult.value;

        const createResult = await createEntry.execute(model, {
            values: createEntryRawData()
        });

        /**
         * Check that we are getting everything properly out of the DynamoDB
         */
        const getResult = await getEntry.execute(model, createResult.value.id);
        expect(getResult.value).toMatchObject({
            values: createEntryRawData()
        });

        await elasticsearch.indices.refresh({
            index: indexName
        });
        /**
         * Then check that we are getting everything properly out of the Elasticsearch, via webiny API.
         */
        const listResult = await listLatestEntries.execute(model, {
            where: {
                id: createResult.value.id
            }
        });

        const { entries: listValue } = listResult.value;
        expect(listValue[0].values.title).toEqual(createExpectedGetResult().values.title);
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

        const getModel = context.container.resolve(GetModelUseCase);
        const createEntry = context.container.resolve(CreateEntryUseCase);
        const getEntry = context.container.resolve(GetEntryByIdUseCase);
        const listLatestEntries = context.container.resolve(ListLatestEntriesUseCase);

        const modelResult = await getModel.execute("converter");
        const model = modelResult.value;

        const createResult = await createEntry.execute(model, {
            values: createEntryRawData()
        });

        /**
         * Check that we are getting everything properly out of the DynamoDB
         */
        const getResult = await getEntry.execute(model, createResult.value.id);
        expect(getResult.value).toMatchObject({
            values: createEntryRawData()
        });
        await elasticsearch.indices.refresh({
            index: indexName
        });
        /**
         * Then check that we are getting everything properly out of the Elasticsearch, via webiny API.
         */
        const listResult = await listLatestEntries.execute(model, {
            where: {
                id: createResult.value.id
            }
        });
        const { entries: listValue } = listResult.value;
        expect(listValue[0].values).toEqual({
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
});
