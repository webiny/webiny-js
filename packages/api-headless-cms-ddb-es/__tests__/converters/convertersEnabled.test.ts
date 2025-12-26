import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { SearchBody } from "@webiny/api-elasticsearch/types";
import { useHandler } from "~tests/graphql/handler";
import { createMockPlugins } from "./mocks";
import {
    createElasticsearchEntryConvertedData,
    createEntryExpectedTransformedDatesData,
    createEntryRawData
} from "./mocks/data";
import { configurations } from "~/configurations";
import type { CmsEntry } from "@webiny/api-headless-cms/types";
import { get } from "@webiny/db-dynamodb";
import { createPartitionKey } from "~/operations/entry/keys";
import lodashMerge from "lodash/merge";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry/index.js";
import { GetEntryByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntryById/index.js";
import { ListLatestEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries/index.js";

describe("storage field path converters enabled", () => {
    const { elasticsearch, entryEntity } = useHandler();

    const { index: indexName } = configurations.es({
        model: {
            tenant: "root",
            modelId: "converter"
        }
    });

    beforeEach(async () => {
        await elasticsearch.indices.deleteAll();
    });

    afterEach(async () => {
        await elasticsearch.indices.deleteAll();
    });

    it("should have fieldId converted to storageId in elasticsearch and dynamodb records", async () => {
        process.env.WEBINY_VERSION = "0.0.0";
        const { createContext } = useHandler({
            plugins: [...createMockPlugins()]
        });
        const context = await createContext();

        const getModel = context.container.resolve(GetModelUseCase);
        const getEntry = context.container.resolve(GetEntryByIdUseCase);
        const createEntry = context.container.resolve(CreateEntryUseCase);
        const listLatest = context.container.resolve(ListLatestEntriesUseCase);

        const modelResult = await getModel.execute("converter");
        if (modelResult.isFail()) {
            throw modelResult.error;
        }

        const model = modelResult.value;

        const createResult = await createEntry.execute(model, createEntryRawData());
        if (createResult.isFail()) {
            throw createResult.error;
        }

        const entry = createResult.value;
        expect(entry).toMatchObject({ id: expect.any(String) });

        /**
         * Check that we are getting everything properly out of the DynamoDB
         */
        const getResult = await getEntry.execute(model, entry.id);
        expect(getResult.value).toMatchObject({
            values: createEntryRawData()
        });
        await elasticsearch.indices.refresh({
            index: indexName
        });
        /**
         * Then check that we are getting everything properly out of the Elasticsearch, via webiny API.
         */
        const result = await listLatest.execute(model, {
            where: { id: entry.id }
        });

        const [[listResult]] = result.value;

        expect(listResult).toMatchObject({
            values: createEntryExpectedTransformedDatesData()
        });
        /**
         * Load the Elasticsearch record directly and check the structure.
         */
        const body: SearchBody = {
            query: {
                bool: {
                    filter: [
                        {
                            term: {
                                ["id.keyword"]: entry.id
                            }
                        }
                    ]
                }
            }
        };
        const { index } = configurations.es({ model });
        const esResponse = await elasticsearch.search({
            index,
            body
        });
        const hits = esResponse?.body?.hits?.hits || [];
        expect(hits.length).toBe(1);
        const source = hits[0]._source;
        const expectedElasticsearchRecord = {
            ...(await createElasticsearchEntryConvertedData()).values
        };
        expect(source.values).toEqual(expectedElasticsearchRecord);
        /**
         * Load the DynamoDB record directly and check the structure.
         */
        const dbResponse = await get<CmsEntry>({
            entity: entryEntity,
            keys: {
                PK: createPartitionKey({
                    ...model,
                    id: entry.id
                }),
                SK: "L"
            }
        });

        const expectedDynamoDbRecord = lodashMerge(
            (await createElasticsearchEntryConvertedData()).values,
            (await createElasticsearchEntryConvertedData()).rawValues
        );

        expect(dbResponse?.values).toEqual({
            ...expectedDynamoDbRecord,
            "long-text@descriptionFieldIdWithSomeValue": {
                compression: "gzip",
                value: expect.any(String)
            },
            "object@informationFieldIdWithSomeValue": {
                ...expectedDynamoDbRecord["object@informationFieldIdWithSomeValue"],
                "long-text@subDescriptionFieldIdWithSomeValue": {
                    compression: "gzip",
                    value: expect.any(String)
                },
                "object@subInformationFieldIdWithSomeValue": {
                    ...expectedDynamoDbRecord["object@informationFieldIdWithSomeValue"][
                        "object@subInformationFieldIdWithSomeValue"
                    ],
                    "long-text@subSecondSubDescriptionFieldIdWithSomeValue": {
                        compression: "gzip",
                        value: expect.any(String)
                    }
                }
            }
        });
    });
});
