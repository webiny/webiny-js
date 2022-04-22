import { createElasticsearchClient } from "@webiny/project-utils/testing/elasticsearch/client";
import { deleteIndexes } from "@webiny/project-utils/testing/elasticsearch/indices";
import { deleteTemplates } from "@webiny/project-utils/testing/elasticsearch/templates";
import { people } from "./base.entries";
import { base } from "~/indexConfiguration/base";
import { ElasticsearchBoolQueryConfig } from "~/types";
import { ElasticsearchQueryBuilderOperatorContainsPlugin } from "~/plugins/operator/contains";

const prefix = process.env.ELASTIC_SEARCH_INDEX_PREFIX || "";

const indexTestName = `${prefix}base-index-test`;
const indexTemplateTestName = "base-index-template-test";

describe("Elasticsearch Base Search", () => {
    const client = createElasticsearchClient();

    const searchPlugin = new ElasticsearchQueryBuilderOperatorContainsPlugin();

    const insertAllData = async () => {
        const operations = [];

        for (const index in people) {
            const id = Number(index) + 1;
            const person = people[index];
            operations.push({
                index: {
                    _id: `person${id}`,
                    _index: indexTestName
                }
            });
            operations.push({
                ...person,
                id
            });
        }

        return await client.bulk({
            body: operations
        });
    };

    const createIndex = async () => {
        return client.indices.create({
            index: indexTestName,
            body: {
                ...base
            }
        });
    };

    const insertTemplate = async () => {
        return client.indices.putTemplate({
            name: indexTemplateTestName,
            body: {
                index_patterns: ["*-index-test"],
                order: 50,
                ...base
            }
        });
    };

    const refreshIndex = async () => {
        return client.indices.refresh({
            index: indexTestName
        });
    };
    const fetchAllData = async () => {
        return client.search({
            index: indexTestName,
            body: {}
        });
    };

    beforeEach(async () => {
        await deleteIndexes({
            client,
            indices: [indexTestName]
        });
        await deleteTemplates({
            client,
            templates: [indexTemplateTestName]
        });
    });

    afterEach(async () => {
        await deleteIndexes({
            client,
            indices: [indexTestName]
        });
        await deleteTemplates({
            client,
            templates: [indexTemplateTestName]
        });
    });

    it("should prepare entries - pre-created indexes", async () => {
        const createResponse = await createIndex();

        expect(createResponse).toMatchObject({
            body: {
                acknowledged: true,
                index: indexTestName
            },
            statusCode: 200
        });

        const insertResponse = await insertAllData();
        expect(insertResponse).toMatchObject({
            body: {
                errors: false,
                items: people.map((_, index) => {
                    const id = Number(index) + 1;
                    return {
                        index: {
                            _id: `person${id}`
                        }
                    };
                })
            },
            statusCode: 200
        });

        const refreshResponse = await refreshIndex();
        expect(refreshResponse).toMatchObject({
            body: {
                _shards: {
                    total: expect.any(Number),
                    successful: expect.any(Number),
                    failed: 0
                }
            },
            statusCode: 200
        });

        const fetchResponse = await fetchAllData();

        expect(fetchResponse).toMatchObject({
            body: {
                hits: {
                    total: {
                        value: people.length,
                        relation: "eq"
                    },
                    hits: people.map((person, index) => {
                        const id = Number(index) + 1;

                        return {
                            _index: indexTestName,
                            _type: "_doc",
                            _id: `person${id}`,
                            _source: {
                                ...person
                            }
                        };
                    })
                }
            },
            statusCode: 200
        });
    });

    it("should prepare entries - index via template", async () => {
        const createResponse = await insertTemplate();

        expect(createResponse).toMatchObject({
            body: {
                acknowledged: true
            },
            statusCode: 200
        });

        const insertResponse = await insertAllData();
        expect(insertResponse).toMatchObject({
            body: {
                errors: false,
                items: people.map((_, index) => {
                    const id = Number(index) + 1;
                    return {
                        index: {
                            _id: `person${id}`
                        }
                    };
                })
            },
            statusCode: 200
        });

        const refreshResponse = await refreshIndex();
        expect(refreshResponse).toMatchObject({
            body: {
                _shards: {
                    total: expect.any(Number),
                    successful: expect.any(Number),
                    failed: 0
                }
            },
            statusCode: 200
        });

        const fetchResponse = await fetchAllData();

        expect(fetchResponse).toMatchObject({
            body: {
                hits: {
                    total: {
                        value: people.length,
                        relation: "eq"
                    },
                    hits: people.map((person, index) => {
                        const id = Number(index) + 1;

                        return {
                            _index: indexTestName,
                            _type: "_doc",
                            _id: `person${id}`,
                            _source: {
                                ...person
                            }
                        };
                    })
                }
            },
            statusCode: 200
        });
    });

    const keywords: [string, string[]][] = [
        ["JaneDoeKeyword", ["Jane Doe"]],
        ["JohnDoeKeyword", ["John Doe"]],
        ["TestKeyword", ["John Doe", "Jane Doe"]],
        ["JaneDoeKeyword".toLowerCase(), ["Jane Doe"]],
        ["JohnDoeKeyword".toLowerCase(), ["John Doe"]],
        ["TestKeyword".toLowerCase(), ["John Doe", "Jane Doe"]],
        ["JaneDoeKeyword".toUpperCase(), ["Jane Doe"]],
        ["JohnDoeKeyword".toUpperCase(), ["John Doe"]],
        ["TestKeyword".toUpperCase(), ["John Doe", "Jane Doe"]]
    ];

    it.each(keywords)(
        "should find entries with target keywords - pre-created indexes - %s",
        async (keyword, names) => {
            await createIndex();
            await insertAllData();
            await refreshIndex();

            const query: ElasticsearchBoolQueryConfig = {
                must: [],
                should: [],
                filter: [],
                must_not: []
            };

            searchPlugin.apply(query, {
                basePath: "biography",
                path: "biography",
                value: keyword,
                keyword: false
            });

            let response: any;

            try {
                response = await client.search({
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
            } catch (ex) {
                throw ex;
            }

            expect(response).toMatchObject({
                body: {
                    hits: {
                        hits: people
                            .map((person, index) => {
                                if (names.includes(person.name) === false) {
                                    return null;
                                }
                                const id = Number(index) + 1;
                                return {
                                    _id: `person${id}`
                                };
                            })
                            .filter(Boolean),
                        total: {
                            relation: "eq",
                            value: names.length
                        }
                    }
                },
                statusCode: 200
            });
        }
    );
});
