import { useCategoryManageHandler } from "../testHelpers/useCategoryManageHandler";
import lodashCamelCase from "lodash/camelCase";
import { setupGroupAndModels } from "../testHelpers/setup";

const categories = [
    "Webiny Headless CMS Project",
    "Webiny Page Builder",
    "Webiny Form Builder",
    "File Manager Webiny",
    "Localization",
    "Page and Form Builder and CMS"
];

const getIt = (name = "") => {
    return name.match("elasticsearch") !== null ? it : it.skip;
};

describe(`graphql "or" queries`, () => {
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

    it(`should filter via root level "OR" condition and return records`, async () => {
        const [singleRootCategoryResponse] = await listCategories({
            where: {
                title_contains: "cms",
                OR: [
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
                            title: "Page and Form Builder and CMS"
                        },
                        {
                            title: "Webiny Headless CMS Project"
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

        const [singleCategoryResponse] = await listCategories({
            where: {
                OR: [
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
                            title: "Page and Form Builder and CMS"
                        },
                        {
                            title: "Webiny Headless CMS Project"
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

        const [multipleRootCategoriesResponse] = await listCategories({
            where: {
                title_contains: "webiny",
                OR: [
                    {
                        title_contains: "builder"
                    }
                ]
            },
            sort: ["createdOn_ASC"]
        });

        expect(multipleRootCategoriesResponse).toMatchObject({
            data: {
                listCategories: {
                    data: [
                        {
                            title: "Webiny Headless CMS Project"
                        },
                        {
                            title: "Webiny Page Builder"
                        },
                        {
                            title: "Webiny Form Builder"
                        },
                        {
                            title: "File Manager Webiny"
                        }
                    ],
                    meta: {
                        totalCount: 4,
                        cursor: null,
                        hasMoreItems: false
                    },
                    error: null
                }
            }
        });

        const [multipleCategoriesResponse] = await listCategories({
            where: {
                OR: [
                    {
                        title_contains: "page builder"
                    },
                    {
                        title_contains: "form"
                    }
                ]
            },
            sort: ["createdOn_ASC"]
        });

        expect(multipleCategoriesResponse).toMatchObject({
            data: {
                listCategories: {
                    data: [
                        {
                            title: "Webiny Page Builder"
                        },
                        {
                            title: "Webiny Form Builder"
                        },
                        {
                            title: "Page and Form Builder and CMS"
                        }
                    ],
                    meta: {
                        totalCount: 3,
                        cursor: null,
                        hasMoreItems: false
                    },
                    error: null
                }
            }
        });
    });

    it.skip(`should filter via nested "OR" conditions and return records`, async () => {
        const [singleCategoryResponse] = await listCategories({
            where: {
                title_contains: "cms",
                OR: [
                    {
                        title_contains: "headless",
                        OR: [
                            {
                                title_contains: "project"
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
            }
        });

        expect(singleCategoryResponse).toMatchObject({
            data: {
                listCategories: {
                    data: [
                        {
                            title: "Webiny Headless CMS Project"
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

        const [multipleCategoriesResponse] = await listCategories({
            where: {
                title_contains: "builder",
                OR: [
                    {
                        title_contains: "form",
                        OR: [
                            {
                                title_contains: "cms"
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
            }
        });

        expect(multipleCategoriesResponse).toMatchObject({
            data: {
                listCategories: {
                    data: [
                        {
                            title: "Page and Form Builder and CMS"
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
    });

    it.skip(`should filter via nested "OR" conditions and not return any record`, async () => {
        /**
         * We will add a single non-existing character to "cms"
         */
        const [cmsCategoryResponse] = await listCategories({
            where: {
                title_contains: "cmsa",
                OR: [
                    {
                        title_contains: "headless",
                        OR: [
                            {
                                title_contains: "project"
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
            }
        });

        expect(cmsCategoryResponse).toMatchObject({
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

        /**
         * We will add a single non-existing character to "headless"
         */
        const [headlessCategoryResponse] = await listCategories({
            where: {
                title_contains: "cms",
                OR: [
                    {
                        title_contains: "headlessk",
                        OR: [
                            {
                                title_contains: "project"
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
            }
        });

        expect(headlessCategoryResponse).toMatchObject({
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

        /**
         * We will add a single non-existing character to "project"
         */
        const [projectCategoryResponse] = await listCategories({
            where: {
                title_contains: "cms",
                OR: [
                    {
                        title_contains: "headless",
                        OR: [
                            {
                                title_contains: "cproject"
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
            }
        });

        expect(projectCategoryResponse).toMatchObject({
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

        /**
         * We will remove a single character from "webiny"
         */
        const [webinyCategoryResponse] = await listCategories({
            where: {
                title_contains: "cms",
                OR: [
                    {
                        title_contains: "headless",
                        OR: [
                            {
                                title_contains: "project"
                            }
                        ]
                    },
                    {
                        OR: [
                            {
                                title_contains: "webny"
                            }
                        ]
                    }
                ]
            }
        });

        expect(webinyCategoryResponse).toMatchObject({
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

    it.skip(`should not return any records`, async () => {
        const [firstResponse] = await listCategories({
            where: {
                OR: [
                    {
                        title_contains: "headless wrong"
                    },
                    {
                        title_contains: "localization wrong"
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
                title_contains: "headless wrong",
                OR: [
                    {
                        title_contains: "localization wrong"
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
