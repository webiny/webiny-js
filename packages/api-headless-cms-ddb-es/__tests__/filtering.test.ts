import { CmsEntryListWhere } from "@webiny/api-headless-cms/types";
import { ElasticsearchBoolQueryConfig } from "@webiny/api-elasticsearch/types";
import { createPluginsContainer, createQuery } from "./filtering/mocks";
import { createExecFiltering, CreateExecFilteringResponse } from "./filtering/mocks/filtering";

describe("convert where to elasticsearch query", () => {
    let query: ElasticsearchBoolQueryConfig;
    let execFiltering: CreateExecFilteringResponse;

    beforeEach(() => {
        query = createQuery();
        execFiltering = createExecFiltering({
            plugins: createPluginsContainer()
        });
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

        execFiltering({
            query,
            where
        });

        const expected = createQuery({
            must: [
                {
                    query_string: {
                        allow_leading_wildcard: true,
                        default_operator: "and",
                        fields: ["values.title"],
                        query: "*webiny*"
                    }
                }
            ],
            filter: [
                {
                    match_phrase_prefix: {
                        "values.title": "CMS"
                    }
                },
                {
                    range: {
                        "values.date": {
                            gte: "2022-01-01"
                        }
                    }
                },
                {
                    terms: {
                        "values.date": [
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
                        "values.date": {
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
                        fields: ["values.title"],
                        query: "*server*"
                    }
                },
                {
                    match_phrase_prefix: {
                        "values.title": "test"
                    }
                },
                {
                    range: {
                        "values.date": {
                            gte: "2022-08-07",
                            lte: "2022-08-08"
                        }
                    }
                },
                {
                    term: {
                        "values.date": "2022-05-05"
                    }
                }
            ]
        });

        expect(query).toEqual(expected);
    });

    it("should create query #1", async () => {
        const where: CmsEntryListWhere = {
            AND: [
                {
                    id_gt: 50
                },
                {
                    title_contains: "webiny"
                },
                {
                    title_contains: "serverless"
                }
            ]
        };

        execFiltering({
            query,
            where
        });

        const expected = createQuery({
            filter: [
                {
                    bool: {
                        must: [
                            {
                                query_string: {
                                    allow_leading_wildcard: true,
                                    default_operator: "and",
                                    fields: ["values.title"],
                                    query: "*webiny*"
                                }
                            },
                            {
                                query_string: {
                                    allow_leading_wildcard: true,
                                    default_operator: "and",
                                    fields: ["values.title"],
                                    query: "*serverless*"
                                }
                            }
                        ],
                        filter: [
                            {
                                range: {
                                    id: {
                                        gt: 50
                                    }
                                }
                            }
                        ]
                    }
                }
            ]
        });

        expect(query).toEqual(expected);
    });

    it("should create query #2", async () => {
        const where: CmsEntryListWhere = {
            id_gt: 50,
            OR: [
                {
                    title_contains: "webiny"
                },
                {
                    title_contains: "serverless"
                }
            ]
        };

        const expected = createQuery({
            filter: [
                {
                    range: {
                        id: {
                            gt: 50
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
                                    fields: ["values.title"],
                                    query: "*webiny*"
                                }
                            }
                        ]
                    }
                },
                {
                    bool: {
                        must: [
                            {
                                query_string: {
                                    allow_leading_wildcard: true,
                                    default_operator: "and",
                                    fields: ["values.title"],
                                    query: "*serverless*"
                                }
                            }
                        ]
                    }
                }
            ],
            minimum_should_match: 1
        });

        execFiltering({
            query,
            where
        });

        expect(query).toEqual(expected);
    });

    it("should create query #3", async () => {
        const where: CmsEntryListWhere = {
            OR: [
                {
                    id_gt: 50
                },
                {
                    title_contains: "webiny"
                },
                {
                    title_contains: "serverless"
                }
            ]
        };

        const expected = createQuery({
            should: [
                {
                    bool: {
                        filter: [
                            {
                                range: {
                                    id: {
                                        gt: 50
                                    }
                                }
                            }
                        ]
                    }
                },
                {
                    bool: {
                        must: [
                            {
                                query_string: {
                                    allow_leading_wildcard: true,
                                    default_operator: "and",
                                    fields: ["values.title"],
                                    query: "*webiny*"
                                }
                            }
                        ]
                    }
                },
                {
                    bool: {
                        must: [
                            {
                                query_string: {
                                    allow_leading_wildcard: true,
                                    default_operator: "and",
                                    fields: ["values.title"],
                                    query: "*serverless*"
                                }
                            }
                        ]
                    }
                }
            ],
            minimum_should_match: 1
        });

        execFiltering({
            query,
            where
        });

        expect(query).toEqual(expected);
    });

    it("should create query #4", async () => {
        const where: CmsEntryListWhere = {
            AND: [
                {
                    id_gt: 50
                },
                {
                    title_contains: "webiny"
                },
                {
                    OR: [
                        {
                            title_contains: "serverless"
                        },
                        {
                            title_contains: "cms"
                        }
                    ]
                }
            ]
        };

        execFiltering({
            query,
            where
        });

        const expected = createQuery({
            filter: [
                {
                    bool: {
                        must: [
                            {
                                query_string: {
                                    allow_leading_wildcard: true,
                                    default_operator: "and",
                                    fields: ["values.title"],
                                    query: "*webiny*"
                                }
                            }
                        ],
                        filter: [
                            {
                                range: {
                                    id: {
                                        gt: 50
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
                                                fields: ["values.title"],
                                                query: "*serverless*"
                                            }
                                        }
                                    ]
                                }
                            },
                            {
                                bool: {
                                    must: [
                                        {
                                            query_string: {
                                                allow_leading_wildcard: true,
                                                default_operator: "and",
                                                fields: ["values.title"],
                                                query: "*cms*"
                                            }
                                        }
                                    ]
                                }
                            }
                        ],
                        minimum_should_match: 1
                    }
                }
            ]
        });

        expect(query).toEqual(expected);
    });

    it(`should add root and "AND" nested query conditions`, async () => {
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

        execFiltering({
            query,
            where
        });

        const expected = createQuery({
            filter: [
                {
                    range: {
                        id: {
                            gte: 2
                        }
                    }
                },
                {
                    bool: {
                        must: [
                            {
                                query_string: {
                                    allow_leading_wildcard: true,
                                    default_operator: "and",
                                    fields: ["values.title"],
                                    query: "*webiny*"
                                }
                            },
                            {
                                query_string: {
                                    allow_leading_wildcard: true,
                                    default_operator: "and",
                                    fields: ["values.title"],
                                    query: "*serverless*"
                                }
                            }
                        ]
                    }
                }
            ]
        });

        expect(query).toEqual(expected);
    });

    it(`should add root and "OR" query conditions`, async () => {
        const where: CmsEntryListWhere = {
            id_gte: 2,
            OR: [
                {
                    title_contains: "webiny"
                },
                {
                    title_contains: "serverless"
                }
            ]
        };

        execFiltering({
            query,
            where
        });

        const expected = createQuery({
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
                                    fields: ["values.title"],
                                    query: "*webiny*"
                                }
                            }
                        ]
                    }
                },
                {
                    bool: {
                        must: [
                            {
                                query_string: {
                                    allow_leading_wildcard: true,
                                    default_operator: "and",
                                    fields: ["values.title"],
                                    query: "*serverless*"
                                }
                            }
                        ]
                    }
                }
            ],
            minimum_should_match: 1
        });

        expect(query).toEqual(expected);
    });

    it(`should add root "AND" condition with nested "AND" and "OR"`, async () => {
        const where: CmsEntryListWhere = {
            title_contains: "cms",
            id_gt: 50,
            OR: [
                {
                    title_contains: "headless",
                    AND: [
                        {
                            title_contains: "form"
                        },
                        {
                            title_contains: "page"
                        }
                    ]
                },
                {
                    OR: [
                        {
                            title_contains: "webiny"
                        }
                    ]
                }
            ]
        };
        execFiltering({
            query,
            where
        });

        const expected = createQuery({
            must: [
                {
                    query_string: {
                        allow_leading_wildcard: true,
                        default_operator: "and",
                        fields: ["values.title"],
                        query: "*cms*"
                    }
                }
            ],
            filter: [
                {
                    range: {
                        id: {
                            gt: 50
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
                                    fields: ["values.title"],
                                    query: "*headless*"
                                }
                            }
                        ],
                        filter: [
                            {
                                bool: {
                                    must: [
                                        {
                                            query_string: {
                                                allow_leading_wildcard: true,
                                                default_operator: "and",
                                                fields: ["values.title"],
                                                query: "*form*"
                                            }
                                        },
                                        {
                                            query_string: {
                                                allow_leading_wildcard: true,
                                                default_operator: "and",
                                                fields: ["values.title"],
                                                query: "*page*"
                                            }
                                        }
                                    ]
                                }
                            }
                        ]
                    }
                },
                {
                    bool: {
                        should: [
                            {
                                bool: {
                                    must: [
                                        {
                                            query_string: {
                                                allow_leading_wildcard: true,
                                                default_operator: "and",
                                                fields: ["values.title"],
                                                query: "*webiny*"
                                            }
                                        }
                                    ]
                                }
                            }
                        ],
                        minimum_should_match: 1
                    }
                }
            ],
            minimum_should_match: 1
        });
        expect(query).toEqual(expected);
    });

    it(`should add root and nested "OR" and "AND" conditions`, async () => {
        const where: CmsEntryListWhere = {
            OR: [
                {
                    price_between: [35000, 100000],
                    OR: [
                        {
                            title_not: "unknown"
                        },
                        {
                            title_contains: "es"
                        },
                        {
                            AND: [
                                {
                                    OR: [
                                        {
                                            title_contains: "st"
                                        },
                                        {
                                            age_gt: 5
                                        }
                                    ]
                                },
                                {
                                    age_between: [2, 18]
                                }
                            ]
                        }
                    ]
                },
                {
                    AND: [
                        {
                            availableOn_gte: "2021-01-01",
                            availableOn_lte: "2021-01-02"
                        }
                    ]
                }
            ]
        };
        execFiltering({
            query,
            where
        });

        const expected = createQuery({
            should: [
                {
                    bool: {
                        should: [
                            {
                                bool: {
                                    must_not: [
                                        {
                                            term: {
                                                "values.title.keyword": "unknown"
                                            }
                                        }
                                    ]
                                }
                            },
                            {
                                bool: {
                                    must: [
                                        {
                                            query_string: {
                                                allow_leading_wildcard: true,
                                                fields: ["values.title"],
                                                query: "*es*",
                                                default_operator: "and"
                                            }
                                        }
                                    ]
                                }
                            },
                            {
                                bool: {
                                    filter: [
                                        {
                                            bool: {
                                                should: [
                                                    {
                                                        bool: {
                                                            must: [
                                                                {
                                                                    query_string: {
                                                                        allow_leading_wildcard:
                                                                            true,
                                                                        fields: ["values.title"],
                                                                        query: "*st*",
                                                                        default_operator: "and"
                                                                    }
                                                                }
                                                            ]
                                                        }
                                                    },
                                                    {
                                                        bool: {
                                                            filter: [
                                                                {
                                                                    range: {
                                                                        "values.age": {
                                                                            gt: 5
                                                                        }
                                                                    }
                                                                }
                                                            ]
                                                        }
                                                    }
                                                ],
                                                filter: [
                                                    {
                                                        range: {
                                                            "values.age": {
                                                                lte: 18,
                                                                gte: 2
                                                            }
                                                        }
                                                    }
                                                ],
                                                minimum_should_match: 1
                                            }
                                        }
                                    ]
                                }
                            }
                        ],
                        filter: [
                            {
                                range: {
                                    "values.price": {
                                        lte: 100000,
                                        gte: 35000
                                    }
                                }
                            }
                        ],
                        minimum_should_match: 1
                    }
                },
                {
                    bool: {
                        filter: [
                            {
                                bool: {
                                    filter: [
                                        {
                                            range: {
                                                "values.availableOn": {
                                                    gte: "2021-01-01"
                                                }
                                            }
                                        },
                                        {
                                            range: {
                                                "values.availableOn": {
                                                    lte: "2021-01-02"
                                                }
                                            }
                                        }
                                    ]
                                }
                            }
                        ]
                    }
                }
            ],
            minimum_should_match: 1
        });

        expect(query).toEqual(expected);
    });
});
