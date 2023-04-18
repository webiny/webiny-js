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
        plugins: [...createCustomFieldPlugins()]
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
        const [createPageResponse] = await handler.createPage(
            {
                category: categoryData.slug
            },
            ["customViews"]
        );

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

    it("should return a custom field value", async () => {
        const [createPageResponse] = await handler.createPage(
            {
                category: categoryData.slug
            },
            ["customViews"]
        );

        const id = createPageResponse.data.pageBuilder.createPage.data.id;

        const [updatePageResponse] = await handler.updatePage(
            {
                id,
                data: {
                    customViews: 10
                }
            },
            ["customViews"]
        );

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
    });
});
