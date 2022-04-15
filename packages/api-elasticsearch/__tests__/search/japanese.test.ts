import {
    createElasticsearchClient,
    deleteAllTemplates,
    deleteAllIndices,
    putTemplate
} from "../helpers";
import { base as baseIndexConfiguration } from "~/indexConfiguration/base";
import { japanese as japaneseIndexConfiguration } from "~/indexConfiguration/japanese";

const items = [
    "躯幹部広範囲CT検査の実際 (2) | Search ー症例報告やプロトコル設定索サイト",
    "検査の実際 (2) | Search Radiologyー症例報告やプロトコル設定検索サイト",
    "躯幹部広範囲CT (2) | Search Radiologyー症例報告やプロトコル設検索サイト",
    "Radiologyー症例報告やプロトコル設定検サイト",
    "例報告やプロトコル設定検索サイト"
];

type SearchParams = [string, number[]];

const searchParameters: SearchParams[] = [
    ["躯", [0, 2]],
    ["例", [0, 1, 2, 3, 4]],
    ["定", [0, 1, 3, 4]],
    ["際", [0, 1]],
    ["躯幹", [0, 2]],
    ["症例報告", [0, 1, 2, 3]],
    ["Radiology", [1, 2, 3]],
    ["検索サイト", [1, 2, 4]], // not working yet - finds one extra (0)
    ["告やプロトコル設", [0, 1, 2, 3, 4]],
    ["Radiologyー症例報告やプロトコル設", [1, 2, 3]],
    ["ロトコル設定検索サイト", [1, 4]], // not working yet - finds none
    ["Search Radiologyー症", [1, 2]],
    ["告やプロトコル設定", [0, 1, 3, 4]]
];

const indexName = "japanese-index-test";

describe("Japanese search", () => {
    const client = createElasticsearchClient();

    const createIndex = async () => {
        return client.indices.create({
            index: indexName,
            body: japaneseIndexConfiguration
        });
    };

    const insertAllData = async () => {
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
        return client.indices.refresh({
            index: indexName
        });
    };
    const fetchAllData = async () => {
        return client.search({
            index: indexName,
            body: {}
        });
    };

    const createIndexTemplate = async () => {
        await putTemplate(client, {
            name: "base-index-template",
            order: 50,
            body: {
                index_patterns: ["*-index-*"],
                aliases: {},
                ...baseIndexConfiguration
            }
        });
        await putTemplate(client, {
            name: "japanese-index-template",
            order: 51,
            body: {
                index_patterns: ["japanese-index-*"],
                aliases: {},
                ...japaneseIndexConfiguration
            }
        });
    };

    const prepareWithIndex = async () => {
        await createIndex();
        await insertAllData();
        await refreshIndex();
        await fetchAllData();
    };

    const prepareWithTemplate = async () => {
        await createIndexTemplate();
        await insertAllData();
        await refreshIndex();
        await fetchAllData();
    };

    beforeEach(async () => {
        await deleteAllIndices(client);
        await deleteAllTemplates(client);
    });

    afterEach(async () => {
        await deleteAllIndices(client);
        await deleteAllTemplates(client);
    });

    it("should verify that all data is prepared", async () => {
        /**
         * first we need to create an index with japanese configuration
         */
        const createIndexResponse = await createIndex();
        expect(createIndexResponse).toMatchObject({
            body: {
                acknowledged: true
            },
            statusCode: 200
        });
        /**
         * Then insert some data...
         */

        const bulkInsertResponse = await insertAllData();
        expect(bulkInsertResponse).toMatchObject({
            body: {
                errors: false,
                items: items.map((_, index) => {
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
                    hits: items.map((title, index) => {
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

    it.each(searchParameters)(
        "pre-created index - should get proper search results for - %s",
        async (search, positions) => {
            await prepareWithIndex();

            const response = await client.search({
                index: indexName,
                body: {
                    query: {
                        bool: {
                            must: [
                                {
                                    query_string: {
                                        allow_leading_wildcard: true,
                                        fields: ["title"],
                                        query: search,
                                        default_operator: "and"
                                    }
                                }
                            ]
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
                            const title = items[index];
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
    it.each(searchParameters)(
        "template index - should get proper search results for - %s",
        async (search, positions) => {
            await prepareWithTemplate();

            const response = await client.search({
                index: indexName,
                body: {
                    query: {
                        bool: {
                            must: [
                                {
                                    query_string: {
                                        allow_leading_wildcard: true,
                                        fields: ["title"],
                                        query: search,
                                        default_operator: "and"
                                    }
                                }
                            ]
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
                            const title = items[index];
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
