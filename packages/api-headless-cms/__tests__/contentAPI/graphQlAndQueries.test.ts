import { beforeEach, describe, expect, it } from "vitest";
import { useCategoryManageHandler } from "../testHelpers/useCategoryManageHandler";
import { setupGroupAndModels } from "../testHelpers/setup";
import { useProductManageHandler } from "../testHelpers/useProductManageHandler";
import lodashCamelCase from "lodash/camelCase";

const createProductsData = (category: string) => {
    return {
        banana: {
            title: "Banana",
            price: 100,
            availableOn: "2021-11-11",
            color: "white",
            availableSizes: ["l", "m"],
            image: "banana.jpg",
            category: {
                modelId: "category",
                id: category
            }
        },
        apple: {
            title: "Apple",
            price: 250,
            availableOn: "2022-11-11",
            color: "red",
            availableSizes: ["m"],
            image: "apple.jpg",
            category: {
                modelId: "category",
                id: category
            }
        },
        strawberry: {
            title: "Strawberry",
            price: 41,
            availableOn: "2020-11-11",
            color: "red",
            availableSizes: ["s"],
            image: "strawberry.jpg",
            category: {
                modelId: "category",
                id: category
            }
        },
        orange: {
            title: "Orange",
            price: 10292,
            availableOn: "2019-11-11",
            color: "black",
            availableSizes: ["l", "m"],
            image: "orange.jpg",
            category: {
                modelId: "category",
                id: category
            }
        }
    };
};

const categories = [
    "Webiny Headless CMS Project",
    "Webiny Page Builder",
    "Webiny Form Builder",
    "File Manager Webiny",
    "Localization",
    "Webiny Page and Form Builder and CMS"
];

describe(`graphql "and" queries`, () => {
    const manager = useCategoryManageHandler({
        path: "manage"
    });
    const { createCategory, listCategories } = manager;

    const { createProduct, listProducts } = useProductManageHandler({
        path: "manage"
    });

    const createProducts = async () => {
        for (const title of categories) {
            await createCategory({
                variables: {
                    data: {
                        values: {
                            title,
                            slug: lodashCamelCase(title)
                        }
                    }
                }
            });
        }
        const [categoryResponse] = await createCategory({
            variables: {
                data: {
                    values: {
                        title: "Fruits",
                        slug: "fruits"
                    }
                }
            }
        });
        const category = categoryResponse.data.createCategory.data!.id;
        const products = createProductsData(category);
        let key: keyof typeof products;
        for (key in products) {
            await createProduct({
                data: {
                    values: products[key]
                }
            });
        }
    };

    beforeEach(async () => {
        await setupGroupAndModels({
            manager,
            models: ["category", "product"]
        });
        await createProducts();
    }, 60_000);

    it(`should filter via root level "AND" condition and return category records`, async () => {
        const [singleRootCategoryResponse] = await listCategories({
            variables: {
                where: {
                    values: {
                        title_contains: "cms",
                        title_not_contains: "page"
                    },
                    AND: [
                        {
                            values: {
                                title_contains: "headless"
                            }
                        },
                        {
                            values: {
                                title_not_contains: "form"
                            }
                        }
                    ]
                }
            }
        });

        expect(singleRootCategoryResponse).toMatchObject({
            data: {
                listCategories: {
                    data: [
                        {
                            values: {
                                title: "Webiny Headless CMS Project"
                            }
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
            variables: {
                where: {
                    values: {
                        slug_not: "localization"
                    },
                    AND: [
                        {
                            values: {
                                title_contains: "cms"
                            }
                        },
                        {
                            values: {
                                title_contains: "headless"
                            }
                        }
                    ]
                }
            }
        });

        expect(singleCategoryResponse).toMatchObject({
            data: {
                listCategories: {
                    data: [
                        {
                            values: {
                                title: "Webiny Headless CMS Project"
                            }
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
            variables: {
                where: {
                    values: {
                        title_contains: "webiny"
                    },
                    AND: [
                        {
                            values: {
                                title_contains: "builder"
                            }
                        }
                    ]
                },
                sort: ["createdOn_ASC"]
            }
        });

        expect(multipleRootCategoriesResponse).toMatchObject({
            data: {
                listCategories: {
                    data: [
                        {
                            values: {
                                title: "Webiny Page Builder"
                            }
                        },
                        {
                            values: {
                                title: "Webiny Form Builder"
                            }
                        },
                        {
                            values: {
                                title: "Webiny Page and Form Builder and CMS"
                            }
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

        const [multipleCategoriesResponse] = await listCategories({
            variables: {
                where: {
                    AND: [
                        {
                            values: {
                                title_contains: "webiny"
                            }
                        },
                        {
                            values: {
                                title_contains: "builder"
                            }
                        }
                    ]
                },
                sort: ["createdOn_ASC"]
            }
        });

        expect(multipleCategoriesResponse).toMatchObject({
            data: {
                listCategories: {
                    data: [
                        {
                            values: {
                                title: "Webiny Page Builder"
                            }
                        },
                        {
                            values: {
                                title: "Webiny Form Builder"
                            }
                        },
                        {
                            values: {
                                title: "Webiny Page and Form Builder and CMS"
                            }
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

        const [multipleCategoriesWithNotResponse] = await listCategories({
            variables: {
                where: {
                    AND: [
                        {
                            values: {
                                title_contains: "webiny"
                            }
                        },
                        {
                            values: {
                                title_contains: "builder"
                            }
                        },
                        {
                            values: {
                                slug_not: "webinyPageBuilder"
                            }
                        }
                    ]
                },
                sort: ["createdOn_ASC"]
            }
        });

        expect(multipleCategoriesWithNotResponse).toMatchObject({
            data: {
                listCategories: {
                    data: [
                        {
                            values: {
                                title: "Webiny Form Builder"
                            }
                        },
                        {
                            values: {
                                title: "Webiny Page and Form Builder and CMS"
                            }
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

    it(`should filter via nested "AND" conditions and return category records`, async () => {
        const [singleCategoryResponse] = await listCategories({
            variables: {
                where: {
                    values: {
                        title_contains: "cms"
                    },
                    AND: [
                        {
                            values: {
                                title_contains: "headless"
                            },
                            AND: [
                                {
                                    values: {
                                        title_contains: "project"
                                    }
                                }
                            ]
                        },
                        {
                            AND: [
                                {
                                    values: {
                                        title_contains: "webiny"
                                    }
                                }
                            ]
                        }
                    ]
                }
            }
        });

        expect(singleCategoryResponse).toMatchObject({
            data: {
                listCategories: {
                    data: [
                        {
                            values: {
                                title: "Webiny Headless CMS Project"
                            }
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
            variables: {
                where: {
                    values: {
                        title_contains: "builder"
                    },
                    AND: [
                        {
                            values: {
                                title_contains: "form"
                            },
                            AND: [
                                {
                                    values: {
                                        title_contains: "cms"
                                    }
                                }
                            ]
                        },
                        {
                            AND: [
                                {
                                    values: {
                                        title_contains: "webiny"
                                    }
                                }
                            ]
                        }
                    ]
                }
            }
        });

        expect(multipleCategoriesResponse).toMatchObject({
            data: {
                listCategories: {
                    data: [
                        {
                            values: {
                                title: "Webiny Page and Form Builder and CMS"
                            }
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

    it(`should filter via nested "AND" conditions and not return any category records`, async () => {
        /**
         * We will add a single non-existing character to "cms"
         */
        const [cmsCategoryResponse] = await listCategories({
            variables: {
                where: {
                    values: {
                        title_contains: "cmsa"
                    },
                    AND: [
                        {
                            values: {
                                title_contains: "headless"
                            },
                            AND: [
                                {
                                    values: {
                                        title_contains: "project"
                                    }
                                }
                            ]
                        },
                        {
                            AND: [
                                {
                                    values: {
                                        title_contains: "webiny"
                                    }
                                }
                            ]
                        }
                    ]
                }
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
            variables: {
                where: {
                    values: {
                        title_contains: "cms"
                    },
                    AND: [
                        {
                            values: {
                                title_contains: "headlessk"
                            },
                            AND: [
                                {
                                    values: {
                                        title_contains: "project"
                                    }
                                }
                            ]
                        },
                        {
                            AND: [
                                {
                                    values: {
                                        title_contains: "webiny"
                                    }
                                }
                            ]
                        }
                    ]
                }
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
            variables: {
                where: {
                    values: {
                        title_contains: "cms"
                    },
                    AND: [
                        {
                            values: {
                                title_contains: "headless"
                            },
                            AND: [
                                {
                                    values: {
                                        title_contains: "cproject"
                                    }
                                }
                            ]
                        },
                        {
                            AND: [
                                {
                                    values: {
                                        title_contains: "webiny"
                                    }
                                }
                            ]
                        }
                    ]
                }
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
            variables: {
                where: {
                    values: {
                        title_contains: "cms"
                    },
                    AND: [
                        {
                            values: {
                                title_contains: "headless"
                            },
                            AND: [
                                {
                                    values: {
                                        title_contains: "project"
                                    }
                                }
                            ]
                        },
                        {
                            AND: [
                                {
                                    values: {
                                        title_contains: "webny"
                                    }
                                }
                            ]
                        }
                    ]
                }
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

    it(`should not return any category records`, async () => {
        const [firstResponse] = await listCategories({
            variables: {
                where: {
                    AND: [
                        {
                            values: {
                                title_contains: "headless"
                            }
                        },
                        {
                            values: {
                                title_contains: "localization"
                            }
                        }
                    ]
                }
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
            variables: {
                where: {
                    values: {
                        title_contains: "headless"
                    },
                    AND: [
                        {
                            values: {
                                title_contains: "localization"
                            }
                        }
                    ]
                }
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

    it("should find products via complex queries", async () => {
        /**
         * We should only get the "Banana" back.
         */
        const [responseBanana] = await listProducts({
            where: {
                values: {
                    availableOn_gte: "2021-11-11"
                },
                AND: [
                    {
                        values: {
                            price_between: [99, 101]
                        }
                    },
                    {
                        values: {
                            availableOn_lt: "2021-12-11"
                        }
                    },
                    {
                        AND: [
                            {
                                values: {
                                    color_in: ["white"]
                                },
                                AND: [
                                    {
                                        values: {
                                            availableSizes_contains: "l"
                                        }
                                    }
                                ]
                            }
                        ],
                        values: {
                            color_not: "black"
                        }
                    }
                ]
            }
        });

        expect(responseBanana).toMatchObject({
            data: {
                listProducts: {
                    data: [
                        {
                            values: {
                                title: "Banana"
                            }
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
         * We should only get the "Apple" back.
         */
        const [responseApple] = await listProducts({
            where: {
                AND: [
                    {
                        values: {
                            price_between: [249, 251]
                        }
                    }
                ]
            }
        });

        expect(responseApple).toMatchObject({
            data: {
                listProducts: {
                    data: [
                        {
                            values: {
                                title: "Apple"
                            }
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
         * There should be no records with both of these conditions.
         */
        const [response] = await listProducts({
            where: {
                AND: [
                    {
                        values: {
                            price_between: [99, 101]
                        }
                    },
                    {
                        values: {
                            price_between: [249, 251]
                        }
                    }
                ]
            }
        });

        expect(response).toMatchObject({
            data: {
                listProducts: {
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
