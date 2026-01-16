import { beforeEach, describe, expect, it } from "vitest";
import { useCategoryManageHandler } from "../testHelpers/useCategoryManageHandler";
import camelCase from "lodash/camelCase";
import { CmsGroup } from "~/types";
import models from "./mocks/contentModels";

const categories = [
    "Fruit",
    "Car",
    "Builder",
    "Laptop",
    "Serverless",
    "Webiny",
    "Programming",
    "Typescript",
    "Node.js",
    "Jest",
    "CRUD"
];

describe("cms entry status filtering", () => {
    const manageOpts = {
        path: "manage"
    };

    const {
        createCategory,
        publishCategory,
        listCategories,
        createContentModelGroupMutation,
        createContentModelMutation,
        updateContentModelMutation
    } = useCategoryManageHandler(manageOpts);

    const setupContentModelGroup = async (): Promise<CmsGroup> => {
        const [createCMG] = await createContentModelGroupMutation({
            data: {
                name: "Group",
                slug: "group",
                icon: "ico/ico",
                description: "description"
            }
        });
        return createCMG.data.createContentModelGroup.data;
    };

    const setupContentModel = async (contentModelGroup: CmsGroup, name: string) => {
        const model = models.find(m => m.modelId === name);
        if (!model) {
            throw new Error(`Could not find model "${name}".`);
        }
        // Create initial record
        const [create] = await createContentModelMutation({
            data: {
                name: model.name,
                modelId: model.modelId,
                singularApiName: model.singularApiName,
                pluralApiName: model.pluralApiName,
                group: contentModelGroup.id
            }
        });

        await updateContentModelMutation({
            modelId: create.data.createContentModel.data.modelId,
            data: {
                fields: model.fields,
                layout: model.layout
            }
        });
    };

    beforeEach(async () => {
        const group = await setupContentModelGroup();
        await setupContentModel(group, "category");
    });

    it("should filter categories by status", async () => {
        for (const i in categories) {
            const title = categories[i];
            const slug = camelCase(title);
            const [response] = await createCategory({
                variables: {
                    data: {
                        values: {
                            title,
                            slug
                        }
                    }
                }
            });
            expect(response).toMatchObject({
                data: {
                    createCategory: {
                        data: {
                            id: expect.any(String),
                            values: {
                                title,
                                slug
                            },
                            meta: {
                                status: "draft",
                                version: 1
                            }
                        },
                        error: null
                    }
                }
            });
            if (Number(i) % 2 === 0) {
                continue;
            }
            const id = response.data.createCategory.data!.id;
            const [publishResponse] = await publishCategory({
                variables: {
                    revision: id
                }
            });
            expect(publishResponse).toMatchObject({
                data: {
                    publishCategory: {
                        data: {
                            id,
                            values: {
                                title,
                                slug
                            },
                            meta: {
                                status: "published",
                                version: 1
                            }
                        },
                        error: null
                    }
                }
            });
        }

        const [listCategoriesResponse] = await listCategories({
            variables: {
                sort: ["createdOn_ASC"],
                limit: 100
            }
        });

        expect(listCategoriesResponse).toMatchObject({
            data: {
                listCategories: {
                    data: categories.map((title, index) => {
                        return {
                            values: {
                                title,
                                slug: camelCase(title)
                            },
                            meta: {
                                status: Number(index) % 2 === 0 ? "draft" : "published",
                                version: 1,
                                locked: Number(index) % 2 !== 0
                            }
                        };
                    }),
                    meta: {
                        hasMoreItems: false,
                        totalCount: categories.length
                    },
                    error: null
                }
            }
        });

        const [listCategoriesDraftResponse] = await listCategories({
            variables: {
                sort: ["createdOn_ASC"],
                limit: 100,
                where: {
                    status: "draft"
                }
            }
        });

        const draftCategoriesList = categories.filter((_, index) => {
            return Number(index) % 2 === 0;
        });
        expect(listCategoriesDraftResponse).toMatchObject({
            data: {
                listCategories: {
                    data: draftCategoriesList.map(title => {
                        return {
                            values: {
                                title,
                                slug: camelCase(title)
                            },
                            meta: {
                                status: "draft",
                                version: 1,
                                locked: false
                            }
                        };
                    }),
                    error: null,
                    meta: {
                        hasMoreItems: false,
                        totalCount: draftCategoriesList.length
                    }
                }
            }
        });

        const [listCategoriesPublishedResponse] = await listCategories({
            variables: {
                sort: ["createdOn_ASC"],
                limit: 100,
                where: {
                    status: "published"
                }
            }
        });

        const publishedCategoriesList = categories.filter((_, index) => {
            return Number(index) % 2 !== 0;
        });
        expect(listCategoriesPublishedResponse).toMatchObject({
            data: {
                listCategories: {
                    data: publishedCategoriesList.map(title => {
                        return {
                            values: {
                                title,
                                slug: camelCase(title)
                            },
                            meta: {
                                status: "published",
                                version: 1,
                                locked: true
                            }
                        };
                    }),
                    error: null,
                    meta: {
                        hasMoreItems: false,
                        totalCount: publishedCategoriesList.length
                    }
                }
            }
        });
    });
});
