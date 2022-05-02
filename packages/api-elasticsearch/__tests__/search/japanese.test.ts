import { createElasticsearchClient } from "../helpers";
import { japanese as japaneseIndexConfiguration } from "~/indexConfiguration/japanese";
import { ElasticsearchQueryBuilderJapaneseOperatorContainsPlugin } from "~/plugins/operator/japanese/contains";
import { ElasticsearchBoolQueryConfig } from "~/types";
import { deleteIndexes } from "@webiny/project-utils/testing/elasticsearch/indices";
import { entries, searchTargets } from "./japanese.entries";
import * as RequestParams from "@elastic/elasticsearch/api/requestParams";

describe("Japanese search", () => {
    const client = createElasticsearchClient();

    const prefix: string = process.env.ELASTIC_SEARCH_INDEX_PREFIX || "";

    const indexName = `${prefix}search-japanese-index-test`;

    const searchPlugin = new ElasticsearchQueryBuilderJapaneseOperatorContainsPlugin();

    const createIndex = async () => {
        try {
            console.log(`Creating index @${new Date().getTime()}: ${indexName}`);
            return await client.indices.create({
                index: indexName,
                body: japaneseIndexConfiguration
            });
        } catch (ex) {
            console.log(JSON.stringify(ex));
            throw ex;
        }
    };

    const insertAllData = async (items: string[]) => {
        const operations = [];

        for (const index in items) {
            const id = `itemId${index}`;
            const value = items[index];
            operations.push({
                index: {
                    _id: id,
                    _index: indexName
                }
            });
            operations.push({
                id: Number(index) + 1,
                title: value
            });
        }

        return await client.bulk({
            body: operations
        });
    };

    const refreshIndex = async () => {
        const result = await client.indices.refresh({
            index: indexName
        });
        await new Promise(resolve => {
            setTimeout(() => {
                resolve(0);
            }, 1500);
        });
        return result;
    };
    const fetchAllData = async () => {
        return await clientSearch({
            index: indexName,
            body: {
                sort: {
                    id: {
                        order: "asc"
                    }
                }
            }
        });
    };

    const prepareWithIndex = async (items: string[]) => {
        try {
            await createIndex();
            await insertAllData(items);
            await refreshIndex();
            await fetchAllData();
        } catch (ex) {
            const response = await client.cat.indices({
                format: "json"
            });
            let availableIndexes: string[] = [];
            if (response.body) {
                availableIndexes = Object.values(response.body).map(item => item.index);
            }
            console.log(
                JSON.stringify({
                    name: "Prepare with index.",
                    prefix,
                    japanese: indexName,
                    availableIndexes,
                    error: ex
                })
            );
            throw ex;
        }
    };

    const clientSearch = async (request: RequestParams.Search) => {
        try {
            console.log(`Searching @${new Date().getTime()}`);
            return await client.search(request);
        } catch (ex) {
            console.log("Searching...");
            console.log(JSON.stringify(ex));
            throw ex;
        }
    };

    beforeEach(async () => {
        await deleteIndexes({
            client,
            prefix
        });
    });

    afterEach(async () => {
        await deleteIndexes({
            client,
            prefix
        });
    });

    it("should verify that all data is prepared", async () => {
        /**
         * first we need to create an index with japanese configuration
         */
        let createIndexResponse;
        try {
            createIndexResponse = await createIndex();
        } catch (ex) {
            throw ex;
        }
        expect(createIndexResponse).toMatchObject({
            body: {
                acknowledged: true
            },
            statusCode: 200
        });
        /**
         * Then insert some data...
         */

        const bulkInsertResponse = await insertAllData(entries);
        expect(bulkInsertResponse).toMatchObject({
            body: {
                errors: false,
                items: entries.map((_, index) => {
                    const id = `itemId${index}`;

                    return {
                        index: {
                            _id: id,
                            _index: indexName,
                            result: "created"
                        }
                    };
                })
            },
            statusCode: 200
        });
        /**
         * We need to wait for the index refresh so we are positive that items are indexed.
         */
        const refreshIndexResponse = await refreshIndex();
        expect(refreshIndexResponse).toMatchObject({
            body: {
                _shards: {
                    total: expect.any(Number),
                    successful: expect.any(Number),
                    failed: 0
                }
            },
            statusCode: 200
        });

        /**
         * Verify that all items are present in the index.
         */
        const fetchAllResponse = await fetchAllData();

        expect(fetchAllResponse).toMatchObject({
            body: {
                hits: {
                    hits: entries.map((title, index) => {
                        const id = `itemId${index}`;

                        return {
                            _id: id,
                            _index: indexName,
                            _source: {
                                id: Number(index) + 1,
                                title
                            }
                        };
                    }),
                    total: {
                        relation: "eq",
                        value: 5
                    }
                }
            },
            statusCode: 200
        });
    });

    it.each(searchTargets)(
        "should get proper search results for - %s",
        async (search, positions) => {
            await prepareWithIndex(entries);

            const query: ElasticsearchBoolQueryConfig = {
                must: [],
                should: [],
                filter: [],
                must_not: []
            };

            searchPlugin.apply(query, {
                basePath: "title",
                path: "title",
                value: search,
                keyword: true
            });

            const response = await clientSearch({
                index: indexName,
                body: {
                    query: {
                        bool: {
                            ...query
                        }
                    },
                    sort: [
                        {
                            id: {
                                order: "asc"
                            }
                        }
                    ],
                    size: 100,
                    search_after: undefined,
                    track_total_hits: true
                }
            });

            expect(response).toMatchObject({
                body: {
                    hits: {
                        hits: positions.map(index => {
                            const title = entries[index];
                            const id = Number(index) + 1;
                            return {
                                _id: `itemId${index}`,
                                _index: indexName,
                                _source: {
                                    id,
                                    title
                                },
                                _score: null,
                                _type: "_doc",
                                sort: [id]
                            };
                        }),
                        total: {
                            relation: "eq",
                            value: positions.length
                        }
                    }
                },
                statusCode: 200
            });
        }
    );
});
