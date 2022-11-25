import { CmsEntryListWhere } from "@webiny/api-headless-cms/types";
import { applyFiltering } from "~/operations/entry/elasticsearch/filtering";
import { ElasticsearchBoolQueryConfig } from "@webiny/api-elasticsearch/types";
import { createFields, createPlugins, createQuery, Plugins } from "./filtering/mocks";

describe("convert where to elasticsearch query", () => {
    let plugins: Plugins;

    let query: ElasticsearchBoolQueryConfig;

    beforeEach(() => {
        plugins = createPlugins();
        query = createQuery();
    });

    it("should add root level query conditions", async () => {
        const where: CmsEntryListWhere = {
            title_contains: "webiny",
            title_not_contains: "server",
            title_not_startsWith: "test",
            title_startsWith: "CMS",
            date_gte: "2022-01-01",
            date_in: [
                "2022-02-01",
                "2022-03-01",
                "2022-04-01",
                "2022-05-01",
                "2022-06-01",
                "2022-07-01",
                "2022-08-01"
            ],
            date_between: ["2022-07-07", "2022-12-07"],
            date_not_between: ["2022-08-07", "2022-08-08"],
            date_not: "2022-05-05"
        };

        applyFiltering({
            fields: createFields(),
            query,
            where,
            searchPlugins: plugins.search,
            operatorPlugins: plugins.operators,
            plugins: plugins.container
        });

        const expected: ElasticsearchBoolQueryConfig = {
            must: [
                {
                    query_string: {
                        allow_leading_wildcard: true,
                        default_operator: "and",
                        fields: ["values.titleStorageId"],
                        query: "*webiny*"
                    }
                }
            ],
            should: [],
            filter: [
                {
                    match_phrase_prefix: {
                        "values.titleStorageId": "CMS"
                    }
                },
                {
                    range: {
                        "values.dateStorageId": {
                            gte: "2022-01-01"
                        }
                    }
                },
                {
                    terms: {
                        "values.dateStorageId": [
                            "2022-02-01",
                            "2022-03-01",
                            "2022-04-01",
                            "2022-05-01",
                            "2022-06-01",
                            "2022-07-01",
                            "2022-08-01"
                        ]
                    }
                },
                {
                    range: {
                        "values.dateStorageId": {
                            gte: "2022-07-07",
                            lte: "2022-12-07"
                        }
                    }
                }
            ],
            must_not: [
                {
                    query_string: {
                        allow_leading_wildcard: true,
                        default_operator: "and",
                        fields: ["values.titleStorageId"],
                        query: "*server*"
                    }
                },
                {
                    match_phrase_prefix: {
                        "values.titleStorageId": "test"
                    }
                },
                {
                    range: {
                        "values.dateStorageId": {
                            gte: "2022-08-07",
                            lte: "2022-08-08"
                        }
                    }
                },
                {
                    term: {
                        "values.dateStorageId": "2022-05-05"
                    }
                }
            ]
        };

        expect(query).toEqual(expected);
    });

    it("should add root and nested query conditions", async () => {
        const where: CmsEntryListWhere = {
            id_gte: 2,
            AND: [
                {
                    title_contains: "webiny"
                },
                {
                    title_contains: "serverless"
                }
            ]
        };

        applyFiltering({
            fields: createFields(),
            query,
            where,
            searchPlugins: plugins.search,
            operatorPlugins: plugins.operators,
            plugins: plugins.container
        });

        const expected: ElasticsearchBoolQueryConfig = {
            must: [],
            must_not: [],
            filter: [
                {
                    range: {
                        idStorageId: {
                            gte: 2
                        }
                    }
                }
            ],
            should: [
                {
                    bool: {
                        must: [
                            {
                                query_string: {
                                    allow_leading_wildcard: true,
                                    default_operator: "and",
                                    fields: ["values.titleStorageId"],
                                    query: "*webiny*"
                                }
                            },
                            {
                                query_string: {
                                    allow_leading_wildcard: true,
                                    default_operator: "and",
                                    fields: ["values.titleStorageId"],
                                    query: "*serverless*"
                                }
                            }
                        ]
                    }
                }
            ]
        };

        expect(query).toEqual(expected);
    });
});
