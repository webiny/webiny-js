import { useCategoryManageHandler } from "../testHelpers/useCategoryManageHandler";
import lodashCamelCase from "lodash/camelCase";
import { setupGroupAndModels } from "../testHelpers/setup";

const categories = [
    "Webiny Headless CMS",
    "Webiny Page Builder",
    "Webiny Form Builder",
    "File Manager Webiny",
    "Localization"
];

const getIt = (name = "") => {
    return name.match("elasticsearch") !== null ? it : it.skip;
};

describe(`graphql "and" queries`, () => {
    const manager = useCategoryManageHandler({
        path: "manage/en-US"
    });
    const { createCategory, listCategories, until } = manager;

    const createCategories = async () => {
        await setupGroupAndModels({
            manager,
            models: ["category"]
        });
        for (const title of categories) {
            await createCategory({
                data: {
                    title,
                    slug: lodashCamelCase(title)
                }
            });
        }
    };

    const it = getIt(manager.storageOperations.name);

    beforeEach(async () => {
        await createCategories();

        await until(
            () => listCategories().then(([data]) => data),
            ({ data }: any) => {
                return data.listCategories.data.length === categories.length;
            },
            {
                name: "list all categories",
                tries: 20,
                debounce: 2000,
                wait: 2000
            }
        );
    });

    it(`should filter via root level "AND" condition and return records`, async () => {
        const [singleRootCategoryResponse] = await listCategories({
            where: {
                title_contains: "cms",
                AND: [
                    {
                        title_contains: "headless"
                    }
                ]
            }
        });

        expect(singleRootCategoryResponse).toMatchObject({
            data: {
                listCategories: {
                    data: [
                        {
                            title: "Webiny Headless CMS"
                        }
                    ],
                    meta: {
                        totalCount: 1,
                        cursor: null,
                        hasMoreItems: false
                    },
                    error: null
                }
            }
        });

        const [singleCategoryResponse] = await listCategories({
            where: {
                AND: [
                    {
                        title_contains: "cms"
                    },
                    {
                        title_contains: "headless"
                    }
                ]
            }
        });

        expect(singleCategoryResponse).toMatchObject({
            data: {
                listCategories: {
                    data: [
                        {
                            title: "Webiny Headless CMS"
                        }
                    ],
                    meta: {
                        totalCount: 1,
                        cursor: null,
                        hasMoreItems: false
                    },
                    error: null
                }
            }
        });

        const [multipleRootCategoriesResponse] = await listCategories({
            where: {
                title_contains: "webiny",
                AND: [
                    {
                        title_contains: "builder"
                    }
                ]
            }
        });

        expect(multipleRootCategoriesResponse).toMatchObject({
            data: {
                listCategories: {
                    data: [
                        {
                            title: "Webiny Form Builder"
                        },
                        {
                            title: "Webiny Page Builder"
                        }
                    ],
                    meta: {
                        totalCount: 2,
                        cursor: null,
                        hasMoreItems: false
                    },
                    error: null
                }
            }
        });

        const [multipleCategoriesResponse] = await listCategories({
            where: {
                AND: [
                    {
                        title_contains: "webiny"
                    },
                    {
                        title_contains: "builder"
                    }
                ]
            }
        });

        expect(multipleCategoriesResponse).toMatchObject({
            data: {
                listCategories: {
                    data: [
                        {
                            title: "Webiny Form Builder"
                        },
                        {
                            title: "Webiny Page Builder"
                        }
                    ],
                    meta: {
                        totalCount: 2,
                        cursor: null,
                        hasMoreItems: false
                    },
                    error: null
                }
            }
        });
    });

    it(`should not return any records`, async () => {
        const [firstResponse] = await listCategories({
            where: {
                AND: [
                    {
                        title_contains: "headless"
                    },
                    {
                        title_contains: "localization"
                    }
                ]
            }
        });

        expect(firstResponse).toMatchObject({
            data: {
                listCategories: {
                    data: [],
                    meta: {
                        totalCount: 0,
                        cursor: null,
                        hasMoreItems: false
                    },
                    error: null
                }
            }
        });

        const [secondResponse] = await listCategories({
            where: {
                title_contains: "headless",
                AND: [
                    {
                        title_contains: "localization"
                    }
                ]
            }
        });

        expect(secondResponse).toMatchObject({
            data: {
                listCategories: {
                    data: [],
                    meta: {
                        totalCount: 0,
                        cursor: null,
                        hasMoreItems: false
                    },
                    error: null
                }
            }
        });
    });
});
