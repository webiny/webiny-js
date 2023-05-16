import useGqlHandler from "../useGqlHandler";
import { extraFields, fileData, simpleRichTextData } from "~tests/crud/mocks/data";
import { createExpectedTags, createMockFileData } from "~tests/crud/mocks/file";

jest.retryTimes(0);

describe("Files CRUD ddb/es", () => {
    const {
        createFile,
        updateFile,
        getFile,
        listFiles,
        listTags,
        clearElasticsearch,
        until,
        createElasticsearchIndice,
        elasticsearch,
        getIndexName
    } = useGqlHandler();

    const locale = "en-US";
    const tenant = "root";

    beforeEach(async () => {
        await clearElasticsearch({
            locale,
            tenant
        });
        await createElasticsearchIndice({
            locale,
            tenant
        });
    });
    afterEach(async () => {
        await clearElasticsearch({
            locale,
            tenant
        });
    });

    test("it should create a new file with custom richText field and then update it", async () => {
        /**
         * Create the file with custom field.
         */
        const [createResponse] = await createFile(
            {
                data: fileData
            },
            extraFields
        );

        expect(createResponse).toEqual({
            data: {
                fileManager: {
                    createFile: {
                        data: fileData,
                        error: null
                    }
                }
            }
        });

        /**
         * Wait until the data is available.
         */
        await until(
            () => listFiles({}).then(([data]: any) => data),
            ({ data }: any) => {
                return (
                    data.fileManager.listFiles.data.length === 1 &&
                    data.fileManager.listFiles.data[0].id === fileData.id
                );
            },
            { name: "list all files after create", tries: 10 }
        );
        /**
         * The file must contain that custom field.
         */
        const [getResponse] = await getFile(
            {
                id: fileData.id
            },
            ["id"].concat(extraFields)
        );

        expect(getResponse).toEqual({
            data: {
                fileManager: {
                    getFile: {
                        data: {
                            ...fileData
                        },
                        error: null
                    }
                }
            }
        });

        /**
         * Update the file data custom field with some new data.
         */
        const { id, ...data } = fileData;
        const [updateResponse] = await updateFile(
            {
                id,
                data: {
                    ...data,
                    richText: simpleRichTextData
                }
            },
            ["id"].concat(extraFields)
        );
        expect(updateResponse).toEqual({
            data: {
                fileManager: {
                    updateFile: {
                        data: {
                            ...fileData,
                            richText: simpleRichTextData
                        },
                        error: null
                    }
                }
            }
        });

        /**
         * The file must contain updated custom field.
         */
        const [getUpdatedResponse] = await getFile(
            {
                id: fileData.id
            },
            ["id"].concat(extraFields)
        );

        expect(getUpdatedResponse).toEqual({
            data: {
                fileManager: {
                    getFile: {
                        data: {
                            ...fileData,
                            richText: simpleRichTextData
                        },
                        error: null
                    }
                }
            }
        });
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
        await elasticsearch.indices.create({
            index
        });
        await elasticsearch.indices.putSettings({
            index,
            body: {
                index: disableIndexing
            }
        });

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
        /**
         * Then let's re-enable indexing.
         */
        await elasticsearch.indices.putSettings({
            index,
            body: {
                index: enableIndexing
            }
        });
        /**
         * ... Refresh the index.
         */
        await elasticsearch.indices.refresh({
            index
        });

        const expectedTags = createExpectedTags({
            amount: maxFiles,
            tenant,
            locale
        });
        /**
         * And then list the tags.
         */
        const [response] = await listTags();
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
