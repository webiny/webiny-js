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

        const expected = createQuery({
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
        });

        execFiltering({
            query,
            where
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
                    }
                }
            ]
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
            filter: [
                {
                    bool: {
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
                    }
                }
            ]
        });

        execFiltering({
            query,
            where
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
                            gte: 2
                        }
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
        // const x = {
        //     must: [
        //         {
        //             query_string: {
        //                 allow_leading_wildcard: true,
        //                 fields: ["values.title"],
        //                 query: "*cms*",
        //                 default_operator: "and"
        //             }
        //         }
        //     ],
        //     filter: [
        //         {
        //             range: {
        //                 id: {
        //                     gt: 50
        //                 }
        //             }
        //         },
        //         {
        //             bool: {
        //                 should: [
        //                     {
        //                         bool: {
        //                             must: [
        //                                 {
        //                                     query_string: {
        //                                         allow_leading_wildcard: true,
        //                                         fields: ["values.title"],
        //                                         query: "*headless*",
        //                                         default_operator: "and"
        //                                     }
        //                                 }
        //                             ],
        //                             filter: [
        //                                 {
        //                                     bool: {
        //                                         must: [
        //                                             {
        //                                                 query_string: {
        //                                                     allow_leading_wildcard: true,
        //                                                     fields: ["values.title"],
        //                                                     query: "*form*",
        //                                                     default_operator: "and"
        //                                                 }
        //                                             },
        //                                             {
        //                                                 query_string: {
        //                                                     allow_leading_wildcard: true,
        //                                                     fields: ["values.title"],
        //                                                     query: "*page*",
        //                                                     default_operator: "and"
        //                                                 }
        //                                             }
        //                                         ]
        //                                     }
        //                                 },
        //                                 {
        //                                     bool: {
        //                                         must: [
        //                                             {
        //                                                 query_string: {
        //                                                     allow_leading_wildcard: true,
        //                                                     fields: ["values.title"],
        //                                                     query: "*form*",
        //                                                     default_operator: "and"
        //                                                 }
        //                                             },
        //                                             {
        //                                                 query_string: {
        //                                                     allow_leading_wildcard: true,
        //                                                     fields: ["values.title"],
        //                                                     query: "*page*",
        //                                                     default_operator: "and"
        //                                                 }
        //                                             }
        //                                         ]
        //                                     }
        //                                 },
        //                                 {
        //                                     bool: {
        //                                         should: [
        //                                             {
        //                                                 bool: {
        //                                                     must: [
        //                                                         {
        //                                                             query_string: {
        //                                                                 allow_leading_wildcard:
        //                                                                     true,
        //                                                                 fields: [
        //                                                                     "values.title"
        //                                                                 ],
        //                                                                 query: "*webiny*",
        //                                                                 default_operator: "and"
        //                                                             }
        //                                                         }
        //                                                     ]
        //                                                 }
        //                                             }
        //                                         ]
        //                                     }
        //                                 }
        //                             ]
        //                         }
        //                     }
        //                 ]
        //             }
        //         }
        //     ]
        // };
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
                },
                {
                    bool: {
                        should: [
                            {
                                bool: {
                                    should: [
                                        {
                                            query_string: {
                                                allow_leading_wildcard: true,
                                                default_operator: "and",
                                                fields: ["values.title"],
                                                query: "*headless*"
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
                                    ],
                                    minimum_should_match: 1
                                }
                            },
                            {
                                bool: {
                                    should: [
                                        {
                                            query_string: {
                                                allow_leading_wildcard: true,
                                                default_operator: "and",
                                                fields: ["values.title"],
                                                query: "*webiny*"
                                            }
                                        }
                                    ],
                                    minimum_should_match: 1
                                }
                            }
                        ]
                    }
                }
            ]
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
                        filter: [
                            {
                                range: {
                                    ["values.price"]: {
                                        gte: 35000,
                                        lte: 100000
                                    }
                                }
                            }
                        ],
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
                                                default_operator: "and",
                                                fields: ["values.title"],
                                                query: "*es*"
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
                                                                        default_operator: "and",
                                                                        fields: ["values.title"],
                                                                        query: "*st*"
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
                                                                        ["values.age"]: {
                                                                            gt: 5
                                                                        }
                                                                    }
                                                                }
                                                            ]
                                                        }
                                                    }
                                                ],
                                                minimum_should_match: 1
                                            }
                                        },
                                        {
                                            range: {
                                                ["values.age"]: {
                                                    gte: 2,
                                                    lte: 18
                                                }
                                            }
                                        }
                                    ]
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
                                range: {
                                    ["values.availableOn"]: {
                                        gte: "2021-01-01"
                                    }
                                }
                            },
                            {
                                range: {
                                    ["values.availableOn"]: {
                                        lte: "2021-01-02"
                                    }
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
