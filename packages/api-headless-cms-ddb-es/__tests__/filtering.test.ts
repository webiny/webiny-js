import { CmsEntryListWhere } from "@webiny/api-headless-cms/types";
import { createBaseQuery } from "~/operations/entry/elasticsearch/initialQuery";
import { applyFiltering } from "~/operations/entry/elasticsearch/filtering";
import { ElasticsearchBoolQueryConfig } from "@webiny/api-elasticsearch/types";
import { getElasticsearchOperators } from "@webiny/api-elasticsearch";
import {
    ElasticsearchQueryBuilderOperatorPlugins,
    ElasticsearchQuerySearchValuePlugins
} from "~/operations/entry/elasticsearch/types";
import { createOperatorPluginList } from "~/operations/entry/elasticsearch/plugins/operator";
import { PluginsContainer } from "@webiny/plugins";
import { createSearchPluginList } from "~/operations/entry/elasticsearch/plugins/search";
import { createFields } from "./filtering/mocks";

describe("convert where to elasticsearch query", () => {
    const buildElasticsearchOperatorPlugins = () => {
        return createOperatorPluginList({
            plugins: new PluginsContainer(getElasticsearchOperators()),
            locale: "en-US"
        });
    };

    const buildElasticsearchSearchPlugins = (): ElasticsearchQuerySearchValuePlugins => {
        return createSearchPluginList({
            plugins: new PluginsContainer()
        });
    };

    let searchPlugins: ElasticsearchQuerySearchValuePlugins;
    let operatorPlugins: ElasticsearchQueryBuilderOperatorPlugins;
    let query: ElasticsearchBoolQueryConfig;

    beforeEach(() => {
        searchPlugins = buildElasticsearchSearchPlugins();
        operatorPlugins = buildElasticsearchOperatorPlugins();
        query = createBaseQuery();
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
            operatorPlugins,
            searchPlugins
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
                        "values.dateStorage": {
                            gte: "2022-01-01"
                        }
                    }
                },
                {
                    terms: {
                        "values.dateStorage": [
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
                        "values.dateStorage": {
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
                        "values.dateStorage": {
                            gte: "2022-08-07",
                            lte: "2022-08-08"
                        }
                    }
                },
                {
                    term: {
                        "values.dateStorage": "2022-05-05"
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
            operatorPlugins,
            searchPlugins
        });

        const expected: ElasticsearchBoolQueryConfig = {
            must: [],
            must_not: [],
            filter: [
                {
                    range: {
                        id: {
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
