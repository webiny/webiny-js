import { createElasticsearchClient } from "@webiny/project-utils/testing/elasticsearch/createClient";
import { people } from "./base.entries";
import { getBaseConfiguration } from "~/indexConfiguration";
import { ElasticsearchBoolQueryConfig } from "~/types";
import { ElasticsearchQueryBuilderOperatorContainsPlugin } from "~/plugins/operator/contains";
import { getElasticsearchIndexPrefix } from "~/indexPrefix";

describe("Elasticsearch Base Search", () => {
    const client = createElasticsearchClient();

    const prefix = getElasticsearchIndexPrefix();

    const indexTestName = `${prefix}search-base-index-test`;

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
            body: getBaseConfiguration()
        });
    };

    const refreshIndex = async () => {
        try {
            return await client.indices.refresh({
                index: indexTestName
            });
        } catch (ex) {
            console.log("Refresh index.");
            console.log(ex.message);
            console.log(JSON.stringify(ex));
            throw ex;
        }
    };
    const fetchAllData = async () => {
        try {
            return await client.search({
                index: indexTestName,
                body: {
                    sort: {
                        id: {
                            order: "asc"
                        }
                    }
                }
            });
        } catch (ex) {
            console.log("Fetch all data.");
            console.log(ex.message);
            console.log(JSON.stringify(ex));
            throw ex;
        }
    };

    beforeEach(async () => {
        return client.indices.deleteAll();
    });

    afterEach(async () => {
        return client.indices.deleteAll();
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
                            // _type: "_doc",
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
                name: "biography",
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
