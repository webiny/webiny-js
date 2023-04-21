import { useGraphQlHandler } from "../handler";
import { recordMocks } from "../mocks";
import { createSchemaPlugin } from "./customFields/schema";
import { createFieldsPlugins } from "./customFields/fields";

jest.retryTimes(0);

describe("custom fields sorting and filtering", () => {
    const { elasticsearch, search } = useGraphQlHandler({
        plugins: [createSchemaPlugin(), createFieldsPlugins()]
    });

    beforeEach(async () => {
        await elasticsearch.indices.deleteAll();
        /**
         * Create the search records.
         */
        await search.createRecord({ data: recordMocks.recordA });
        await search.createRecord({ data: recordMocks.recordB });
        await search.createRecord({ data: recordMocks.recordC });
        await search.createRecord({ data: recordMocks.recordD });
        await search.createRecord({ data: recordMocks.recordE });
        await search.createRecord({ data: recordMocks.recordF });
        await search.createRecord({ data: recordMocks.recordG });
        await search.createRecord({ data: recordMocks.recordH });
    });
    afterEach(async () => {
        await elasticsearch.indices.deleteAll();
    });

    it("should validate for existence of mock search records", async () => {
        /**
         * Validate that all required records are in the Elasticsearch.
         */
        const [listValidateRecordsResponse] = await search.listRecords({
            where: {
                type: "post"
            },
            sort: {
                createdOn: "ASC"
            }
        });

        expect(listValidateRecordsResponse).toMatchObject({
            data: {
                search: {
                    listRecords: {
                        data: [
                            {
                                id: "post-d"
                            },
                            {
                                id: "post-e"
                            },
                            {
                                id: "post-f"
                            },
                            {
                                id: "post-g"
                            },
                            {
                                id: "post-h"
                            }
                        ],
                        meta: {
                            totalCount: 5,
                            hasMoreItems: false,
                            cursor: null
                        },
                        error: null
                    }
                }
            }
        });
    });

    it("should be able to filter via custom field", async () => {
        /**
         * Find all the records with num equal 5
         */
        const [listNumEq5Response] = await search.listRecords({
            where: {
                type: "post",
                num: 5
            }
        });
        expect(listNumEq5Response).toMatchObject({
            data: {
                search: {
                    listRecords: {
                        data: [
                            {
                                id: "post-h",
                                data: {
                                    num: 5
                                }
                            }
                        ],
                        meta: {
                            totalCount: 1,
                            hasMoreItems: false,
                            cursor: null
                        },
                        error: null
                    }
                }
            }
        });
        /**
         * Find all the records with num greater or equal than 3
         */
        const [listNumGte3Response] = await search.listRecords({
            where: {
                type: "post",
                num_gte: 3
            },
            sort: {
                createdOn: "ASC"
            }
        });
        expect(listNumGte3Response).toMatchObject({
            data: {
                search: {
                    listRecords: {
                        data: [
                            {
                                id: "post-g"
                            },
                            {
                                id: "post-h"
                            }
                        ],
                        meta: {
                            totalCount: 2,
                            hasMoreItems: false,
                            cursor: null
                        },
                        error: null
                    }
                }
            }
        });
        /**
         * Find all the records with the something being no
         */
        const [listSomethingNoResponse] = await search.listRecords({
            where: {
                type: "post",
                something: "no"
            },
            sort: {
                createdOn: "ASC"
            }
        });
        expect(listSomethingNoResponse).toMatchObject({
            data: {
                search: {
                    listRecords: {
                        data: [
                            {
                                id: "post-g",
                                data: {
                                    something: "no"
                                }
                            }
                        ],
                        meta: {
                            totalCount: 1,
                            hasMoreItems: false,
                            cursor: null
                        },
                        error: null
                    }
                }
            }
        });
        /**
         * Find all the records with the something being yes or no
         */
        const [listSomethingYesOrNoResponse] = await search.listRecords({
            where: {
                type: "post",
                something_in: ["yes", "no"]
            },
            sort: {
                createdOn: "ASC"
            }
        });
        expect(listSomethingYesOrNoResponse).toMatchObject({
            data: {
                search: {
                    listRecords: {
                        data: [
                            {
                                id: "post-f",
                                data: {
                                    something: "yes"
                                }
                            },
                            {
                                id: "post-g",
                                data: {
                                    something: "no"
                                }
                            },
                            {
                                id: "post-h",
                                data: {
                                    something: "yes"
                                }
                            }
                        ],
                        meta: {
                            totalCount: 3,
                            hasMoreItems: false,
                            cursor: null
                        },
                        error: null
                    }
                }
            }
        });
    });

    it("should be able to sort via custom field", async () => {
        /**
         * Sort by num field ASC
         */
        const [listSortNumAscResponse] = await search.listRecords({
            where: {
                type: "post"
            },
            sort: {
                num: "ASC"
            }
        });

        expect(listSortNumAscResponse).toMatchObject({
            data: {
                search: {
                    listRecords: {
                        data: [
                            {
                                id: "post-f",
                                data: {
                                    num: 1
                                }
                            },
                            {
                                id: "post-g",
                                data: {
                                    num: 3
                                }
                            },
                            {
                                id: "post-h",
                                data: {
                                    num: 5
                                }
                            },
                            {
                                id: "post-d"
                            },
                            {
                                id: "post-e"
                            }
                        ],
                        meta: {
                            totalCount: 5,
                            hasMoreItems: false,
                            cursor: null
                        },
                        error: null
                    }
                }
            }
        });
        /**
         * Sort by num field DESC
         */
        const [listSortNumDescResponse] = await search.listRecords({
            where: {
                type: "post"
            },
            sort: {
                num: "DESC"
            }
        });

        expect(listSortNumDescResponse).toMatchObject({
            data: {
                search: {
                    listRecords: {
                        data: [
                            {
                                id: "post-h",
                                data: {
                                    num: 5
                                }
                            },
                            {
                                id: "post-g",
                                data: {
                                    num: 3
                                }
                            },
                            {
                                id: "post-f",
                                data: {
                                    num: 1
                                }
                            },
                            {
                                id: "post-d"
                            },
                            {
                                id: "post-e"
                            }
                        ],
                        meta: {
                            totalCount: 5,
                            hasMoreItems: false,
                            cursor: null
                        },
                        error: null
                    }
                }
            }
        });
    });
});
