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

describe(`graphql "or" queries`, () => {
    const manager = useCategoryManageHandler({
        path: "manage/en-US"
    });
    const { createCategory, listCategories } = manager;

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

    beforeEach(async () => {
        await createCategories();
    });

    it(`should filter via root level "OR" condition and return records`, async () => {
        const [singleRootCategoryResponse] = await listCategories({
            where: {
                title_contains: "cms",
                OR: [
                    {
                        title_contains: "headless"
                    },
                    {
                        title_contains: "project"
                    }
                ]
            }
        });

        expect(singleRootCategoryResponse).toMatchObject({
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
                            title: "Webiny Page Builder"
                        },
                        {
                            title: "Webiny Form Builder"
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

    it(`should filter via nested "OR" conditions and return records`, async () => {
        const [singleCategoryResponse] = await listCategories({
            where: {
                OR: [
                    {
                        OR: [
                            {
                                title_contains: "form"
                            }
                        ]
                    },
                    {
                        OR: [
                            {
                                title_contains: "page"
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
                            title: "Page and Form Builder and CMS"
                        },
                        {
                            title: "Webiny Form Builder"
                        },
                        {
                            title: "Webiny Page Builder"
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

        const [singlePageCategoriesResponse] = await listCategories({
            where: {
                OR: [
                    {
                        title_contains: "form"
                    },
                    {
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

        expect(singlePageCategoriesResponse).toMatchObject({
            data: {
                listCategories: {
                    data: [
                        {
                            title: "Page and Form Builder and CMS"
                        },
                        {
                            title: "File Manager Webiny"
                        },
                        {
                            title: "Webiny Form Builder"
                        },
                        {
                            title: "Webiny Page Builder"
                        },
                        {
                            title: "Webiny Headless CMS Project"
                        }
                    ],
                    meta: {
                        totalCount: 5,
                        cursor: null,
                        hasMoreItems: false
                    },
                    error: null
                }
            }
        });

        const [deeplyNestedCategoriesResponse] = await listCategories({
            where: {
                OR: [
                    {
                        title_contains: "form wrong"
                    },
                    {
                        OR: [
                            {
                                title_contains: "cms wrong"
                            }
                        ]
                    },
                    {
                        OR: [
                            {
                                title_contains: "webiny wrong"
                            },
                            {
                                OR: [
                                    {
                                        title_contains: "not-serverless"
                                    },
                                    {
                                        OR: [
                                            {
                                                title_contains: "builder"
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        });

        expect(deeplyNestedCategoriesResponse).toMatchObject({
            data: {
                listCategories: {
                    data: [
                        {
                            title: "Page and Form Builder and CMS"
                        },
                        {
                            title: "Webiny Form Builder"
                        },
                        {
                            title: "Webiny Page Builder"
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

        const [multiPageCategoriesResponse1] = await listCategories({
            where: {
                OR: [
                    {
                        title_contains: "form"
                    },
                    {
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
            },
            limit: 3
        });

        expect(multiPageCategoriesResponse1).toMatchObject({
            data: {
                listCategories: {
                    data: [
                        {
                            title: "Page and Form Builder and CMS"
                        },
                        {
                            title: "File Manager Webiny"
                        },
                        {
                            title: "Webiny Form Builder"
                        }
                    ],
                    meta: {
                        totalCount: 5,
                        cursor: expect.any(String),
                        hasMoreItems: true
                    },
                    error: null
                }
            }
        });

        const [multiPageCategoriesResponse2] = await listCategories({
            where: {
                OR: [
                    {
                        title_contains: "form"
                    },
                    {
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
            },
            limit: 3,
            after: multiPageCategoriesResponse1.data.listCategories.meta.cursor
        });
        expect(multiPageCategoriesResponse2).toMatchObject({
            data: {
                listCategories: {
                    data: [
                        {
                            title: "Webiny Page Builder"
                        },
                        {
                            title: "Webiny Headless CMS Project"
                        }
                    ],
                    meta: {
                        totalCount: 5,
                        cursor: null,
                        hasMoreItems: false
                    },
                    error: null
                }
            }
        });
    });

    it(`should filter via nested "OR" conditions`, async () => {
        /**
         * We will add a single non-existing character to "cms", "project" and "webiny"
         */
        const [cmsCategoryResponse] = await listCategories({
            where: {
                OR: [
                    {
                        title_contains: "cms"
                    },
                    {
                        OR: [
                            {
                                title_contains: "projectX"
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

        expect(cmsCategoryResponse).toMatchObject({
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

        /**
         * We will add a single non-existing character to "cms", "project" and "webiny"
         */
        const [noCmsCategoryResponse] = await listCategories({
            where: {
                OR: [
                    {
                        title_contains: "cmsC"
                    },
                    {
                        OR: [
                            {
                                title_contains: "projectX"
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

        expect(noCmsCategoryResponse).toMatchObject({
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
        const [headlessProjectCategoryResponse] = await listCategories({
            where: {
                OR: [
                    {
                        title_contains: "cmsC"
                    },
                    {
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

        expect(headlessProjectCategoryResponse).toMatchObject({
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

        /**
         * We will add a single non-existing character to "project"
         */
        const [webinyCategoryResponse] = await listCategories({
            where: {
                OR: [
                    {
                        title_contains: "cmsA"
                    },
                    {
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

        expect(webinyCategoryResponse).toMatchObject({
            data: {
                listCategories: {
                    data: [
                        {
                            title: "File Manager Webiny"
                        },
                        {
                            title: "Webiny Form Builder"
                        },
                        {
                            title: "Webiny Page Builder"
                        },
                        {
                            title: "Webiny Headless CMS Project"
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

        /**
         * We will remove a single character from "webiny"
         */
        const [projectCategoryResponse] = await listCategories({
            where: {
                OR: [
                    {
                        title_contains: "cmsA"
                    },
                    {
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

        expect(projectCategoryResponse).toMatchObject({
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
    });

    it(`should not return any records`, async () => {
        const [firstResponse] = await listCategories({
            where: {
                OR: [
                    {
                        title_contains: "headless wrong"
                    },
                    {
                        title_contains: "localization wrong"
                    },
                    {
                        OR: [
                            {
                                title_contains: "cms wrong"
                            }
                        ]
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
