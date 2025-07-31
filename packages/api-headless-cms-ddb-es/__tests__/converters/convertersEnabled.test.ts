import type { SearchBody } from "@webiny/api-elasticsearch/types";
import { useHandler } from "~tests/graphql/handler";
import { createMockPlugins } from "./mocks";
import {
    createElasticsearchEntryConvertedData,
    createEntryExpectedTransformedDatesData,
    createEntryRawData
} from "./mocks/data";
import { configurations } from "~/configurations";
import type { CmsEntry, CmsModel } from "@webiny/api-headless-cms/types";
import { get } from "@webiny/db-dynamodb";
import { createPartitionKey } from "~/operations/entry/keys";
import lodashMerge from "lodash/merge";

jest.retryTimes(0);

describe("storage field path converters enabled", () => {
    const { elasticsearch, entryEntity } = useHandler();

    const { index: indexName } = configurations.es({
        model: {
            tenant: "root",
            locale: "en-US",
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

        const model = (await context.cms.getModel("converter")) as CmsModel;
        const manager = await context.cms.getEntryManager("converter");

        const createResult = await manager.create(createEntryRawData());
        expect(createResult).toMatchObject({
            id: expect.any(String)
        });
        /**
         * Check that we are getting everything properly out of the DynamoDB
         */
        const getResult = await manager.get(createResult.id);
        expect(getResult).toMatchObject({
            values: createEntryRawData()
        });
        await elasticsearch.indices.refresh({
            index: indexName
        });
        /**
         * Then check that we are getting everything properly out of the Elasticsearch, via webiny API.
         */
        const result = await manager.listLatest({
            where: {
                id: createResult.id
            }
        });
        const [[listResult]] = result;
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
                                ["id.keyword"]: createResult.id
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
                    id: createResult.id
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
