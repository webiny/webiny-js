import { CmsContentModelGroupType } from "@webiny/api-headless-cms/types";
import { useContentGqlHandler } from "../utils/useContentGqlHandler";
import models from "./mocks/contentModels";
import { useCategoryManageHandler } from "../utils/useCategoryManageHandler";
import { useCategoryReadHandler } from "../utils/useCategoryReadHandler";

describe("READ - Resolvers", () => {
    let contentModelGroup: CmsContentModelGroupType;

    const esCmsIndex = "root-headless-cms";

    const manageOpts = { path: "manage/en-US" };
    const readOpts = { path: "read/en-US" };

    const {
        elasticSearch,
        createContentModelMutation,
        updateContentModelMutation,
        createContentModelGroupMutation
    } = useContentGqlHandler(manageOpts);

    beforeEach(async () => {
        try {
            await elasticSearch.indices.create({ index: esCmsIndex });
        } catch {
            // Ignore errors
        }

        const [createCMG] = await createContentModelGroupMutation({
            data: {
                name: "Group",
                slug: "group",
                icon: "ico/ico",
                description: "description"
            }
        });
        contentModelGroup = createCMG.data.createContentModelGroup.data;

        const category = models.find(m => m.modelId === "category");

        // Create initial record
        const [create] = await createContentModelMutation({
            data: {
                name: category.name,
                modelId: category.modelId,
                group: contentModelGroup.id
            }
        });

        if (create.errors) {
            console.error(`[beforeEach] ${create.errors[0].message}`);
            process.exit(1);
        }

        const [update] = await updateContentModelMutation({
            modelId: create.data.createContentModel.data.modelId,
            data: {
                fields: category.fields,
                layout: category.layout
            }
        });

        if (update.errors) {
            console.error(`[beforeEach] ${update.errors[0].message}`);
            process.exit(1);
        }
    });

    afterEach(async () => {
        try {
            await elasticSearch.indices.delete({ index: esCmsIndex });
        } catch (e) {}
    });

    test(`should return a NOT_FOUND error when getting an entry by non-existing ID`, async () => {
        const { getCategory } = useCategoryReadHandler(readOpts);

        const [response] = await getCategory({
            where: {
                id: 123
            }
        });

        expect(response.data.getCategory).toMatchObject({
            data: null,
            error: {
                code: "NOT_FOUND"
            }
        });
    });

    test(`should return a list of published entries (no parameters)`, async () => {
        // Use "manage" API to create and publish entries
        const { until, createCategory, publishCategory } = useCategoryManageHandler(manageOpts);

        // Create an entry
        const [create] = await createCategory({ data: { title: "Title 1", slug: "slug-1" } });
        const { id } = create.data.createCategory.data;

        // Publish it so it becomes available in the "read" API
        await publishCategory({ revision: id });

        // See if entries are available via "read" API
        const { listCategories } = useCategoryReadHandler(readOpts);

        // If this `until` resolves successfully, we know entry is accessible via the "read" API
        await until(
            () => listCategories().then(([data]) => data),
            ({ data }) => data.listCategories.data[0].id === id
        );
    });

    test(`list entries (limit)`, async () => {
        const { listCategories } = useCategoryReadHandler(readOpts);

        const [response] = await listCategories({
            limit: 1
        });

        expect(response).toEqual({
            data: {
                listCategories: {
                    data: [
                        {
                            id: 123
                        }
                    ],
                    meta: {
                        totalCount: 5
                    }
                }
            }
        });
    });

    test(`list entries (limit + after)`, async () => {
        const { listCategories } = useCategoryReadHandler(readOpts);

        const [response] = await listCategories({
            limit: 1,
            after: "someAfterString"
        });

        expect(response).toEqual({
            data: {
                listCategories: {
                    data: [
                        {
                            title: "category"
                        }
                    ],
                    meta: {
                        cursor: "fds",
                        hasMoreItems: true,
                        totalCount: 15
                    }
                }
            }
        });
    });

    test(`list entries (sort ASC)`, async () => {
        const { listCategories } = useCategoryReadHandler(readOpts);

        const [response] = await listCategories({
            sort: ["title_ASC"]
        });

        expect(response).toEqual({
            data: {
                listCategories: {
                    data: [
                        {
                            title: "First category"
                        },
                        {
                            title: "Second category"
                        }
                    ]
                }
            }
        });
    });

    test(`list entries (sort DESC)`, async () => {
        const { listCategories } = useCategoryReadHandler(readOpts);

        const [response] = await listCategories({
            sort: ["title_DESC"]
        });

        expect(response).toEqual({
            data: {
                listCategories: {
                    data: [
                        {
                            title: "Second category"
                        },
                        {
                            title: "First category"
                        }
                    ]
                }
            }
        });
    });

    test("list entries that contains given value", async () => {
        const { listCategories } = useCategoryReadHandler(readOpts);

        const [response] = await listCategories({
            where: {
                // eslint-disable-next-line @typescript-eslint/camelcase
                title_contains: "first"
            }
        });

        expect(response).toEqual({
            data: {
                listCategories: {
                    data: [
                        {
                            title: "First category",
                            slug: "first-category"
                        }
                    ],
                    error: null
                }
            }
        });
    });

    test("list entries that do not contains given value", async () => {
        const { listCategories } = useCategoryReadHandler(readOpts);

        const [response] = await listCategories({
            where: {
                // eslint-disable-next-line @typescript-eslint/camelcase
                title_not_contains: "first"
            }
        });

        expect(response).toEqual({
            data: {
                listCategories: {
                    data: [
                        {
                            title: "Second category",
                            slug: "second-category"
                        }
                    ],
                    error: null
                }
            }
        });
    });

    test("list entries that are in given values", async () => {
        const { listCategories } = useCategoryReadHandler(readOpts);

        const [response] = await listCategories({
            where: {
                // eslint-disable-next-line @typescript-eslint/camelcase
                slug_in: ["first-category"]
            }
        });

        expect(response).toEqual({
            data: {
                listCategories: {
                    data: [
                        {
                            title: "First category",
                            slug: "first-category"
                        }
                    ],
                    error: null
                }
            }
        });
    });

    test("list entries that are not in given values", async () => {
        const { listCategories } = useCategoryReadHandler(readOpts);

        const [response] = await listCategories({
            where: {
                // eslint-disable-next-line @typescript-eslint/camelcase
                slug_not_in: ["first-category"]
            }
        });

        expect(response).toEqual({
            data: {
                listCategories: {
                    data: [
                        {
                            title: "Second category",
                            slug: "second-category"
                        }
                    ],
                    error: null
                }
            }
        });
    });
});
