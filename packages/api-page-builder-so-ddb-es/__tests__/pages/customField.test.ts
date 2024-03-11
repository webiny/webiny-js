import { Category } from "@webiny/api-page-builder/types";
import { useHandler } from "~tests/useHandler";
import { createCustomFieldPlugins } from "~tests/pages/customField/plugins";

jest.retryTimes(0);

const categoryData: Pick<Category, "slug" | "name" | "url" | "layout"> = {
    slug: `mock-category`,
    name: `Mock Category`,
    url: `/mock-category/`,
    layout: `layout`
};

describe("page custom field", () => {
    const handler = useHandler({
        plugins: [...createCustomFieldPlugins()],
        withFields: ["customViews"]
    });

    beforeEach(async () => {
        await handler.clearElasticsearch();
        await handler.createCategory({
            data: categoryData
        });
    });

    afterEach(async () => {
        await handler.clearElasticsearch();
    });

    it("should extend the graphql schema with plugins", async () => {
        const [response] = await handler.introspect();

        const typePbPage = response.data.__schema.types.find((type: any) => {
            return type.name === "PbPage";
        });

        expect(typePbPage).toMatchObject({
            kind: "OBJECT",
            name: "PbPage",
            fields: [
                {
                    name: "id"
                },
                {
                    name: "pid"
                },
                {
                    name: "uniquePageId"
                },
                {
                    name: "editor"
                },
                {
                    name: "createdFrom"
                },
                {
                    name: "createdBy"
                },
                {
                    name: "createdOn"
                },
                {
                    name: "savedOn"
                },
                {
                    name: "publishedOn"
                },
                {
                    name: "locked"
                },
                {
                    name: "category"
                },
                {
                    name: "version"
                },
                {
                    name: "title"
                },
                {
                    name: "status"
                },
                {
                    name: "path"
                },
                {
                    name: "url"
                },
                {
                    name: "settings"
                },
                {
                    name: "content"
                },
                {
                    name: "revisions"
                },
                {
                    name: "customViews"
                },
                {
                    name: "wbyAco_location"
                }
            ]
        });

        const typePbPageListItem = response.data.__schema.types.find((type: any) => {
            return type.name === "PbPageListItem";
        });

        expect(typePbPageListItem).toMatchObject({
            kind: "OBJECT",
            name: "PbPageListItem",
            fields: [
                {
                    name: "id"
                },
                {
                    name: "pid"
                },
                {
                    name: "uniquePageId"
                },
                {
                    name: "editor"
                },
                {
                    name: "status"
                },
                {
                    name: "locked"
                },
                {
                    name: "publishedOn"
                },
                {
                    name: "images"
                },
                {
                    name: "version"
                },
                {
                    name: "category"
                },
                {
                    name: "title"
                },
                {
                    name: "snippet"
                },
                {
                    name: "tags"
                },
                {
                    name: "path"
                },
                {
                    name: "url"
                },
                {
                    name: "savedOn"
                },
                {
                    name: "createdFrom"
                },
                {
                    name: "createdOn"
                },
                {
                    name: "createdBy"
                },
                {
                    name: "settings"
                },
                {
                    name: "customViews"
                }
            ]
        });

        const inputPbUpdatePageInput = response.data.__schema.types.find((type: any) => {
            return type.name === "PbUpdatePageInput";
        });
        expect(inputPbUpdatePageInput).toMatchObject({
            kind: "INPUT_OBJECT",
            name: "PbUpdatePageInput",
            inputFields: [
                {
                    name: "title"
                },
                {
                    name: "category"
                },
                {
                    name: "path"
                },
                {
                    name: "settings"
                },
                {
                    name: "content"
                },
                {
                    name: "customViews"
                }
            ]
        });

        const inputPbListPagesWhereInput = response.data.__schema.types.find((type: any) => {
            return type.name === "PbListPagesWhereInput";
        });

        expect(inputPbListPagesWhereInput).toMatchObject({
            kind: "INPUT_OBJECT",
            name: "PbListPagesWhereInput",
            inputFields: [
                {
                    name: "pid_in"
                },
                {
                    name: "category"
                },
                {
                    name: "status"
                },
                {
                    name: "tags"
                },
                {
                    name: "customViews"
                },
                {
                    name: "customViews_gt"
                },
                {
                    name: "customViews_gte"
                },
                {
                    name: "customViews_lt"
                },
                {
                    name: "customViews_lte"
                },
                {
                    name: "customViews_not"
                },
                {
                    name: "customViews_between"
                }
            ]
        });

        const inputPbListPublishedPagesWhereInput = response.data.__schema.types.find(
            (type: any) => {
                return type.name === "PbListPublishedPagesWhereInput";
            }
        );

        expect(inputPbListPublishedPagesWhereInput).toMatchObject({
            kind: "INPUT_OBJECT",
            name: "PbListPublishedPagesWhereInput",
            inputFields: [
                {
                    name: "category"
                },
                {
                    name: "tags"
                },
                {
                    name: "customViews"
                },
                {
                    name: "customViews_gt"
                },
                {
                    name: "customViews_gte"
                },
                {
                    name: "customViews_lt"
                },
                {
                    name: "customViews_lte"
                },
                {
                    name: "customViews_not"
                },
                {
                    name: "customViews_between"
                }
            ]
        });

        const enumPbListPagesSort = response.data.__schema.types.find((type: any) => {
            return type.name === "PbListPagesSort";
        });

        expect(enumPbListPagesSort).toMatchObject({
            kind: "ENUM",
            name: "PbListPagesSort",
            enumValues: [
                {
                    name: "id_ASC"
                },
                {
                    name: "id_DESC"
                },
                {
                    name: "savedOn_ASC"
                },
                {
                    name: "savedOn_DESC"
                },
                {
                    name: "createdOn_ASC"
                },
                {
                    name: "createdOn_DESC"
                },
                {
                    name: "publishedOn_ASC"
                },
                {
                    name: "publishedOn_DESC"
                },
                {
                    name: "title_ASC"
                },
                {
                    name: "title_DESC"
                },
                {
                    name: "customViews_ASC"
                },
                {
                    name: "customViews_DESC"
                }
            ],
            possibleTypes: null
        });
    });

    it("should return a custom field default value", async () => {
        const [createPageResponse] = await handler.createPage({
            category: categoryData.slug
        });

        expect(createPageResponse).toMatchObject({
            data: {
                pageBuilder: {
                    createPage: {
                        data: {
                            id: expect.any(String),
                            customViews: 0
                        },
                        error: null
                    }
                }
            }
        });
    });

    it("should store and output a custom field value", async () => {
        const [createPageResponse] = await handler.createPage({
            category: categoryData.slug
        });

        const id = createPageResponse.data.pageBuilder.createPage.data.id;

        const [updatePageResponse] = await handler.updatePage({
            id,
            data: {
                customViews: 10
            }
        });

        expect(updatePageResponse).toMatchObject({
            data: {
                pageBuilder: {
                    updatePage: {
                        data: {
                            id,
                            customViews: 10
                        },
                        error: null
                    }
                }
            }
        });

        const [getPageResponse] = await handler.getPage({ id });

        expect(getPageResponse).toMatchObject({
            data: {
                pageBuilder: {
                    getPage: {
                        data: {
                            id,
                            customViews: 10
                        },
                        error: null
                    }
                }
            }
        });

        const [listPagesResponse] = await handler.listPages({});

        expect(listPagesResponse).toMatchObject({
            data: {
                pageBuilder: {
                    listPages: {
                        data: [
                            {
                                id,
                                customViews: 10
                            }
                        ],
                        error: null
                    }
                }
            }
        });
    });

    it("should be able to query by a custom field", async () => {
        const [createPageResponse] = await handler.createPage({
            category: categoryData.slug
        });

        const id = createPageResponse.data.pageBuilder.createPage.data.id;

        await handler.updatePage({
            id,
            data: {
                customViews: 10
            }
        });

        const expectedHit = {
            data: {
                pageBuilder: {
                    listPages: {
                        data: [
                            {
                                id,
                                customViews: 10
                            }
                        ],
                        error: null
                    }
                }
            }
        };
        const expectedMiss = {
            data: {
                pageBuilder: {
                    listPages: {
                        data: [],
                        error: null
                    }
                }
            }
        };
        /**
         * Equal
         */
        const [responseEqualHit] = await handler.listPages({
            where: {
                customViews: 10
            }
        });
        expect(responseEqualHit).toMatchObject(expectedHit);
        const [responseEqualMiss] = await handler.listPages({
            where: {
                customViews: 9
            }
        });
        expect(responseEqualMiss).toMatchObject(expectedMiss);
        /**
         * Greater Than
         */
        const [responseGtHit] = await handler.listPages({
            where: {
                customViews_gt: 9
            }
        });
        expect(responseGtHit).toMatchObject(expectedHit);
        const [responseGtMiss] = await handler.listPages({
            where: {
                customViews_gt: 10
            }
        });
        expect(responseGtMiss).toMatchObject(expectedMiss);
        /**
         * Greater Than or Equal
         */
        const [responseGteHit] = await handler.listPages({
            where: {
                customViews_gte: 10
            }
        });
        expect(responseGteHit).toMatchObject(expectedHit);
        const [responseGteMiss] = await handler.listPages({
            where: {
                customViews_gte: 11
            }
        });
        expect(responseGteMiss).toMatchObject(expectedMiss);
        /**
         * Lesser Than
         */
        const [responseLtHit] = await handler.listPages({
            where: {
                customViews_lt: 11
            }
        });
        expect(responseLtHit).toMatchObject(expectedHit);
        const [responseLtMiss] = await handler.listPages({
            where: {
                customViews_lt: 10
            }
        });
        expect(responseLtMiss).toMatchObject(expectedMiss);
        /**
         * Lesser Than or Equal
         */
        const [responseLteHit] = await handler.listPages({
            where: {
                customViews_lte: 10
            }
        });
        expect(responseLteHit).toMatchObject(expectedHit);
        const [responseLteMiss] = await handler.listPages({
            where: {
                customViews_lte: 9
            }
        });
        expect(responseLteMiss).toMatchObject(expectedMiss);
        /**
         * Not Equal
         */
        const [responseNotHit] = await handler.listPages({
            where: {
                customViews_not: 9
            }
        });
        expect(responseNotHit).toMatchObject(expectedHit);
        const [responseNotMiss] = await handler.listPages({
            where: {
                customViews_not: 10
            }
        });
        expect(responseNotMiss).toMatchObject(expectedMiss);

        /**
         * Between
         */
        const [responseBetweenHit] = await handler.listPages({
            where: {
                customViews_between: [9, 10]
            }
        });
        expect(responseBetweenHit).toMatchObject(expectedHit);
        const [responseBetweenExactHit] = await handler.listPages({
            where: {
                customViews_between: [10, 11]
            }
        });
        expect(responseBetweenExactHit).toMatchObject(expectedHit);
        const [responseBetweenExact2Hit] = await handler.listPages({
            where: {
                customViews_between: [10, 10]
            }
        });
        expect(responseBetweenExact2Hit).toMatchObject(expectedHit);
        const [responseBetweenMiss] = await handler.listPages({
            where: {
                customViews_between: [11, 55]
            }
        });
        expect(responseBetweenMiss).toMatchObject(expectedMiss);
    });

    it("should be able to sort by a custom field", async () => {
        const pageIdList: [string, number][] = [];
        for (let current = 0; current < 10; current++) {
            const [createPageResponse] = await handler.createPage({
                category: categoryData.slug
            });

            const id = createPageResponse.data.pageBuilder.createPage.data.id;
            const customViews = current * 5;
            pageIdList.push([id, customViews]);

            await handler.updatePage({
                id,
                data: {
                    title: `Page ${id}`,
                    customViews
                }
            });
        }

        const reversedPageIdList = [...pageIdList].reverse();

        const [pagesValidationResponse] = await handler.listPages({
            sort: ["createdOn_ASC"]
        });
        expect(pagesValidationResponse).toMatchObject({
            data: {
                pageBuilder: {
                    listPages: {
                        data: pageIdList.map(([id, customViews]) => {
                            return {
                                id,
                                title: `Page ${id}`,
                                customViews
                            };
                        }),
                        meta: {
                            cursor: null,
                            totalCount: 10,
                            hasMoreItems: false
                        },
                        error: null
                    }
                }
            }
        });
        /**
         * Sort by the custom field ASC.
         */
        const [listPagesAscResponse] = await handler.listPages({
            sort: ["customViews_ASC"]
        });

        expect(listPagesAscResponse).toMatchObject({
            data: {
                pageBuilder: {
                    listPages: {
                        data: pageIdList.map(([id, customViews]) => {
                            return {
                                id,
                                title: `Page ${id}`,
                                customViews
                            };
                        }),
                        meta: {
                            cursor: null,
                            totalCount: 10,
                            hasMoreItems: false
                        },
                        error: null
                    }
                }
            }
        });

        /**
         * Sort by the custom field DESC.
         */
        const [listPagesDescResponse] = await handler.listPages({
            sort: ["customViews_DESC"]
        });

        expect(listPagesDescResponse).toMatchObject({
            data: {
                pageBuilder: {
                    listPages: {
                        data: reversedPageIdList.map(([id, customViews]) => {
                            return {
                                id,
                                title: `Page ${id}`,
                                customViews
                            };
                        }),
                        meta: {
                            cursor: null,
                            totalCount: 10,
                            hasMoreItems: false
                        },
                        error: null
                    }
                }
            }
        });
        /**
         * Sort by the custom field ASC, with limit and after
         */
        const [listPagesAscLimitResponse] = await handler.listPages({
            sort: ["customViews_ASC"],
            limit: 5
        });

        expect(listPagesAscLimitResponse).toMatchObject({
            data: {
                pageBuilder: {
                    listPages: {
                        data: pageIdList.slice(0, 5).map(([id, customViews]) => {
                            return {
                                id,
                                title: `Page ${id}`,
                                customViews
                            };
                        }),
                        meta: {
                            cursor: expect.any(String),
                            totalCount: 10,
                            hasMoreItems: true
                        },
                        error: null
                    }
                }
            }
        });

        const [listPagesAscLimitAfterResponse] = await handler.listPages({
            sort: ["customViews_ASC"],
            limit: 5,
            after: listPagesAscLimitResponse.data.pageBuilder.listPages.meta.cursor
        });

        expect(listPagesAscLimitAfterResponse).toMatchObject({
            data: {
                pageBuilder: {
                    listPages: {
                        data: pageIdList.slice(5).map(([id, customViews]) => {
                            return {
                                id,
                                title: `Page ${id}`,
                                customViews
                            };
                        }),
                        meta: {
                            cursor: null,
                            totalCount: 10,
                            hasMoreItems: false
                        },
                        error: null
                    }
                }
            }
        });

        /**
         * Sort by the custom field DESC, with limit and after
         */
        const [listPagesDescLimitResponse] = await handler.listPages({
            sort: ["customViews_DESC"],
            limit: 5
        });

        expect(listPagesDescLimitResponse).toMatchObject({
            data: {
                pageBuilder: {
                    listPages: {
                        data: reversedPageIdList.slice(0, 5).map(([id, customViews]) => {
                            return {
                                id,
                                title: `Page ${id}`,
                                customViews
                            };
                        }),
                        meta: {
                            cursor: expect.any(String),
                            totalCount: 10,
                            hasMoreItems: true
                        },
                        error: null
                    }
                }
            }
        });

        const [listPagesDescLimitAfterResponse] = await handler.listPages({
            sort: ["customViews_DESC"],
            limit: 5,
            after: listPagesDescLimitResponse.data.pageBuilder.listPages.meta.cursor
        });

        expect(listPagesDescLimitAfterResponse).toMatchObject({
            data: {
                pageBuilder: {
                    listPages: {
                        data: reversedPageIdList.slice(5).map(([id, customViews]) => {
                            return {
                                id,
                                title: `Page ${id}`,
                                customViews
                            };
                        }),
                        meta: {
                            cursor: null,
                            totalCount: 10,
                            hasMoreItems: false
                        },
                        error: null
                    }
                }
            }
        });
    });
});
