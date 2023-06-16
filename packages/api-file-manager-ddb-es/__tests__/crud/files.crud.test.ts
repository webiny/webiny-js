import useGqlHandler from "../useGqlHandler";
import { createExpectedTags, createMockFileData } from "~tests/crud/mocks/file";
import { getDefaultPrefix } from "~tests/defaultPrefix";

jest.retryTimes(0);

describe("Files CRUD ddb/es", () => {
    const { listTags, createElasticsearchIndice, elasticsearch, getIndexName } = useGqlHandler();

    const locale = "en-US";
    const tenant = "root";

    beforeEach(async () => {
        process.env.ELASTIC_SEARCH_INDEX_PREFIX = getDefaultPrefix();
        await elasticsearch.indices.deleteAll();
        await createElasticsearchIndice({
            locale,
            tenant
        });
    });
    afterEach(async () => {
        await elasticsearch.indices.deleteAll();
    });

    const disableIndexing = {
        number_of_replicas: 0,
        refresh_interval: -1
    };
    const enableIndexing = {
        /**
         * You can set to what ever you want
         */
        number_of_replicas: 1,
        refresh_interval: "1s"
    };

    it("should list tags when having a large number of files and tags", async () => {
        const index = getIndexName({
            tenant,
            locale
        });
        /**
         * Let's create an index, make it not actually index anything, so we can insert data faster.
         */
        try {
            await elasticsearch.indices.create({
                index,
                body: {
                    settings: {
                        index: disableIndexing
                    }
                }
            });
        } catch (ex) {
            console.log(`Could not create index ${index}: ${ex.message}`);
            throw ex;
        }

        const operations: any[] = [];
        /**
         * TODO change to test larger amount of files
         */
        const maxFiles = 100;
        /**
         * Now let's insert a large amount of files.
         */
        for (let i = 0; i < maxFiles; i++) {
            const fileId = `file_${i}`;
            const file = createMockFileData({
                index: i,
                tenant,
                locale
            });
            operations.push({ index: { _id: fileId, _index: index } }, file);
        }

        let result: any;
        let error: any = null;
        try {
            result = await elasticsearch.bulk({
                body: operations
            });
        } catch (ex) {
            error = ex;
        }
        expect(error).toEqual(null);
        expect(result).toMatchObject({
            body: {
                errors: false
            },
            statusCode: 200
        });
        try {
            /**
             * Then let's re-enable indexing.
             */
            await elasticsearch.indices.putSettings({
                index,
                body: {
                    index: enableIndexing
                }
            });
        } catch (ex) {
            console.log(`Could not put settings for index ${index}: ${ex.message}`);
            throw ex;
        }

        try {
            /**
             * ... Refresh the index.
             */
            await elasticsearch.indices.refresh({
                index
            });
        } catch (ex) {
            console.log(`Could not refresh index ${index}: ${ex.message}`);
            throw ex;
        }

        const expectedTags = createExpectedTags({
            amount: maxFiles,
            tenant,
            locale
        });

        let response: any;
        /**
         * And then list the tags.
         */
        try {
            [response] = await listTags();
        } catch (ex) {
            console.log(`Could not list tags: ${ex.message}`);
            throw ex;
        }
        /**
         * Must be the amount of files + 2 (one for tenant and one for locale).
         */
        expect(response.data.fileManager.listTags.data).toHaveLength(maxFiles + 2);
        expect(response).toEqual({
            data: {
                fileManager: {
                    listTags: {
                        data: expectedTags,
                        error: null
                    }
                }
            }
        });
    });
});
