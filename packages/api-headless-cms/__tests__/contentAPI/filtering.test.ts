import { useFruitManageHandler } from "../utils/useFruitManageHandler";
import { useGraphQLHandler } from "../utils/useGraphQLHandler";
import { useFruitReadHandler } from "../utils/useFruitReadHandler";
import { useCategoryManageHandler } from "../utils/useCategoryManageHandler";
import { useProductManageHandler } from "../utils/useProductManageHandler";
import { useProductReadHandler } from "../utils/useProductReadHandler";
import { useArticleManageHandler } from "../utils/useArticleManageHandler";
import { useArticleReadHandler } from "../utils/useArticleReadHandler";
import { setupContentModelGroup, setupContentModels } from "../utils/setup";
import { Fruit } from "./mocks/contentModels";

const appleData: Fruit = {
    name: "Apple",
    isSomething: false,
    rating: 400,
    numbers: [5, 6, 7.2, 10.18, 12.05],
    email: "john@doe.com",
    url: "https://apple.test",
    lowerCase: "apple",
    upperCase: "APPLE",
    date: "2020-12-15",
    dateTime: new Date("2020-12-15T12:12:21").toISOString(),
    dateTimeZ: "2020-12-15T14:52:41+01:00",
    time: "11:39:58",
    description: "fruit named apple",
    slug: null
};

const strawberryData: Fruit = {
    name: "Strawberry",
    isSomething: true,
    rating: 500,
    numbers: [5, 6, 7.2, 10.18, 12.05],
    email: "john@doe.com",
    url: "https://strawberry.test",
    lowerCase: "strawberry",
    upperCase: "STRAWBERRY",
    date: "2020-12-18",
    dateTime: new Date("2020-12-19T12:12:21").toISOString(),
    dateTimeZ: "2020-12-25T14:52:41+01:00",
    time: "12:44:55",
    description: "strawberry named fruit",
    slug: null
};

const bananaData: Fruit = {
    name: "Banana",
    isSomething: false,
    rating: 450,
    numbers: [5, 6, 7.2, 10.18, 12.05],
    email: "john@doe.com",
    url: "https://banana.test",
    lowerCase: "banana",
    upperCase: "BANANA",
    date: "2020-12-03",
    dateTime: new Date("2020-12-03T12:12:21").toISOString(),
    dateTimeZ: "2020-12-03T14:52:41+01:00",
    time: "11:59:01",
    description: "fruit banana named",
    slug: null
};

jest.setTimeout(100000);

describe("filtering", () => {
    const manageOpts = { path: "manage/en-US" };
    const readOpts = { path: "read/en-US" };

    const mainManager = useGraphQLHandler(manageOpts);

    const { until, createFruit, publishFruit } = useFruitManageHandler({
        ...manageOpts
    });

    const filterOutFields = ["meta"];

    const createAndPublishFruit = async (data: any): Promise<Fruit> => {
        const [response] = await createFruit({
            data
        });

        const createdFruit = response.data.createFruit.data;

        const [publish] = await publishFruit({
            revision: createdFruit.id
        });

        const fruit: Fruit = publish.data.publishFruit.data;

        for (const field of filterOutFields) {
            // @ts-ignore
            delete fruit[field];
        }
        return fruit;
    };

    const createFruits = async () => {
        return {
            apple: await createAndPublishFruit(appleData),
            strawberry: await createAndPublishFruit(strawberryData),
            banana: await createAndPublishFruit(bananaData)
        };
    };

    const setupFruits = async () => {
        const group = await setupContentModelGroup(mainManager);
        await setupContentModels(mainManager, group, ["fruit"]);
        return createFruits();
    };

    const waitFruits = async (name: string, { listFruits }: any) => {
        // If this `until` resolves successfully, we know entry is accessible via the "read" API
        await until(
            () => listFruits({}).then(([data]: any) => data),
            ({ data }: any) => {
                return data.listFruits.data.length === 3;
            },
            { name: `list all fruits - ${name}` }
        );
    };

    test("should filter fruits by date and sort asc", async () => {
        const { apple, strawberry } = await setupFruits();

        const handler = useFruitReadHandler({
            ...readOpts
        });
        const { listFruits } = handler;

        await waitFruits("should filter fruits by date and sort asc", handler);

        const [response] = await listFruits({
            where: {
                date_gte: "2020-12-15"
            },
            sort: ["date_ASC"]
        });

        expect(response).toEqual({
            data: {
                listFruits: {
                    data: [apple, strawberry],
                    error: null,
                    meta: {
                        cursor: null,
                        hasMoreItems: false,
                        totalCount: 2
                    }
                }
            }
        });
    });

    test("should filter fruits by date and sort desc", async () => {
        const { apple, strawberry } = await setupFruits();

        const handler = useFruitReadHandler({
            ...readOpts
        });
        const { listFruits } = handler;

        await waitFruits("should filter fruits by date and sort desc", handler);

        const [response] = await listFruits({
            where: {
                date_gte: "2020-12-15"
            },
            sort: ["date_DESC"]
        });

        expect(response).toEqual({
            data: {
                listFruits: {
                    data: [strawberry, apple],
                    error: null,
                    meta: {
                        cursor: null,
                        hasMoreItems: false,
                        totalCount: 2
                    }
                }
            }
        });
    });

    test("should filter fruits by dateTime and sort asc", async () => {
        const { banana } = await setupFruits();

        const handler = useFruitReadHandler({
            ...readOpts
        });
        const { listFruits } = handler;

        await waitFruits("should filter fruits by dateTime and sort asc", handler);

        const [response] = await listFruits({
            where: {
                dateTime_gte: new Date("2020-12-03T01:01:01Z").toISOString(),
                dateTime_lte: new Date("2020-12-04T01:01:01Z").toISOString()
            },
            sort: ["dateTime_ASC"]
        });

        expect(response).toEqual({
            data: {
                listFruits: {
                    data: [banana],
                    error: null,
                    meta: {
                        cursor: null,
                        hasMoreItems: false,
                        totalCount: 1
                    }
                }
            }
        });
    });

    test("should filter fruits by dateTimeZ and sort desc", async () => {
        const { apple, strawberry } = await setupFruits();

        const handler = useFruitReadHandler({
            ...readOpts
        });
        const { listFruits } = handler;

        await waitFruits("should filter fruits by dateTimeZ and sort asc", handler);

        const [response] = await listFruits({
            where: {
                dateTimeZ_gte: "2020-12-15T14:52:41+01:00",
                dateTimeZ_lte: "2020-12-25T14:52:41+01:00"
            },
            sort: ["dateTimeZ_DESC"]
        });

        expect(response).toEqual({
            data: {
                listFruits: {
                    data: [strawberry, apple],
                    error: null,
                    meta: {
                        cursor: null,
                        hasMoreItems: false,
                        totalCount: 2
                    }
                }
            }
        });
    });

    test("should filter fruits by date, dateTime, dateTimeZ and sort desc", async () => {
        const { apple, banana } = await setupFruits();

        const handler = useFruitReadHandler({
            ...readOpts
        });
        const { listFruits } = handler;

        await waitFruits(
            "should filter fruits by date, dateTime, dateTimeZ and sort desc",
            handler
        );

        const [response] = await listFruits({
            where: {
                date_gte: "2020-12-03",
                date_lt: "2020-12-16",
                dateTime_gte: new Date("2020-12-03T01:01:01Z").toISOString(),
                dateTime_lte: new Date("2020-12-17T01:01:01Z").toISOString(),
                dateTimeZ_gte: "2020-12-02T14:52:41+01:00",
                dateTimeZ_lte: "2020-12-25T14:52:41+01:00"
            },
            sort: ["date_DESC"]
        });

        expect(response).toEqual({
            data: {
                listFruits: {
                    data: [apple, banana],
                    error: null,
                    meta: {
                        cursor: null,
                        hasMoreItems: false,
                        totalCount: 2
                    }
                }
            }
        });
    });

    test("should filter fruits by time and sort desc", async () => {
        const { strawberry, banana } = await setupFruits();

        const handler = useFruitReadHandler({
            ...readOpts
        });
        const { listFruits } = handler;

        await waitFruits("should filter fruits by time and sort desc", handler);
        const [response] = await listFruits({
            where: {
                time_gte: "11:59:01",
                time_lte: "12:44:55"
            },
            sort: ["time_DESC"]
        });

        expect(response).toEqual({
            data: {
                listFruits: {
                    data: [strawberry, banana],
                    error: null,
                    meta: {
                        cursor: null,
                        hasMoreItems: false,
                        totalCount: 2
                    }
                }
            }
        });
    });

    test("should sort by time asc", async () => {
        const { apple, strawberry, banana } = await setupFruits();

        const handler = useFruitReadHandler({
            ...readOpts
        });
        const { listFruits } = handler;

        await waitFruits("should sort by time asc", handler);

        const [response] = await listFruits({
            sort: ["time_ASC"]
        });

        expect(response).toEqual({
            data: {
                listFruits: {
                    data: [apple, banana, strawberry],
                    error: null,
                    meta: {
                        cursor: null,
                        hasMoreItems: false,
                        totalCount: 3
                    }
                }
            }
        });
    });

    describe("GraphQL Data Filtering Tests", () => {
        test("should be able to filter fruits by a boolean attribute", async () => {
            await setupFruits();

            const handler = useFruitReadHandler({
                ...readOpts
            });
            const { listFruits } = handler;

            await waitFruits("GraphQL filtering by a boolean attribute", handler);

            await listFruits({
                where: {
                    isSomething: true
                }
            }).then(([response]) => {
                expect(response).toMatchObject({
                    data: {
                        listFruits: {
                            data: [
                                {
                                    lowerCase: "strawberry",
                                    name: "Strawberry",
                                    upperCase: "STRAWBERRY",
                                    url: "https://strawberry.test"
                                }
                            ],
                            error: null,
                            meta: {
                                cursor: null,
                                hasMoreItems: false,
                                totalCount: 1
                            }
                        }
                    }
                });
            });

            // Let's use the "not" operator.
            await listFruits({
                where: {
                    isSomething_not: true
                }
            }).then(([response]) => {
                expect(response).toMatchObject({
                    data: {
                        listFruits: {
                            data: [
                                {
                                    lowerCase: "banana",
                                    name: "Banana",
                                    upperCase: "BANANA",
                                    url: "https://banana.test"
                                },
                                {
                                    lowerCase: "apple",
                                    name: "Apple",
                                    upperCase: "APPLE",
                                    url: "https://apple.test"
                                }
                            ],
                            error: null,
                            meta: {
                                cursor: null,
                                hasMoreItems: false,
                                totalCount: 2
                            }
                        }
                    }
                });
            });
        });

        test("should be able to filter fruits by a number attribute", async () => {
            await setupFruits();

            const handler = useFruitReadHandler({
                ...readOpts
            });
            const { listFruits } = handler;

            await waitFruits("GraphQL filtering by a number attribute", handler);

            await listFruits({
                where: {
                    rating: 450
                }
            }).then(([response]) => {
                expect(response).toMatchObject({
                    data: {
                        listFruits: {
                            data: [
                                {
                                    lowerCase: "banana",
                                    name: "Banana",
                                    upperCase: "BANANA",
                                    url: "https://banana.test"
                                }
                            ],
                            error: null,
                            meta: {
                                cursor: null,
                                hasMoreItems: false,
                                totalCount: 1
                            }
                        }
                    }
                });
            });

            // Let's use the "not" operator.
            await listFruits({
                where: {
                    rating_not: 450
                }
            }).then(([response]) => {
                expect(response).toMatchObject({
                    data: {
                        listFruits: {
                            data: [
                                {
                                    lowerCase: "strawberry",
                                    name: "Strawberry",
                                    upperCase: "STRAWBERRY",
                                    url: "https://strawberry.test"
                                },
                                {
                                    lowerCase: "apple",
                                    name: "Apple",
                                    upperCase: "APPLE",
                                    url: "https://apple.test"
                                }
                            ],
                            error: null,
                            meta: {
                                cursor: null,
                                hasMoreItems: false,
                                totalCount: 2
                            }
                        }
                    }
                });
            });

            // Let's use the "in" operator.
            await listFruits({
                where: {
                    rating_in: [450, 500]
                }
            }).then(([response]) => {
                expect(response).toMatchObject({
                    data: {
                        listFruits: {
                            data: [
                                {
                                    lowerCase: "banana",
                                    name: "Banana",
                                    upperCase: "BANANA",
                                    url: "https://banana.test"
                                },
                                {
                                    lowerCase: "strawberry",
                                    name: "Strawberry",
                                    upperCase: "STRAWBERRY",
                                    url: "https://strawberry.test"
                                }
                            ],
                            error: null,
                            meta: {
                                cursor: null,
                                hasMoreItems: false,
                                totalCount: 2
                            }
                        }
                    }
                });
            });
        });
    });

    test("should filter by reference field", async () => {
        const categoryManager = useCategoryManageHandler(manageOpts);
        const productManager = useProductManageHandler(manageOpts);
        const productReader = useProductReadHandler(readOpts);

        const group = await setupContentModelGroup(mainManager);
        const { category: categoryModel } = await setupContentModels(mainManager, group, [
            "category",
            "product"
        ]);

        const [createFruitResponse] = await categoryManager.createCategory({
            data: {
                title: "Fruit category 123",
                slug: "fruit-category-123"
            }
        });
        expect(createFruitResponse).toEqual({
            data: {
                createCategory: {
                    data: expect.any(Object),
                    error: null
                }
            }
        });

        const [createCarManufacturerResponse] = await categoryManager.createCategory({
            data: {
                title: "Car manufacturer",
                slug: "car-manufacturer"
            }
        });
        expect(createCarManufacturerResponse).toEqual({
            data: {
                createCategory: {
                    data: expect.any(Object),
                    error: null
                }
            }
        });

        const fruitCategoryId = createFruitResponse.data.createCategory.data.id;
        const carManufacturerCategoryId = createCarManufacturerResponse.data.createCategory.data.id;

        await categoryManager.publishCategory({
            revision: fruitCategoryId
        });
        await categoryManager.publishCategory({
            revision: carManufacturerCategoryId
        });

        const [createBananaResponse] = await productManager.createProduct({
            data: {
                title: "Banana",
                price: 100,
                availableOn: "2021-04-19",
                color: "red",
                availableSizes: ["l"],
                image: "banana.jpg",
                category: {
                    modelId: categoryModel.modelId,
                    id: fruitCategoryId
                }
            }
        });
        expect(createBananaResponse).toEqual({
            data: {
                createProduct: {
                    data: expect.any(Object),
                    error: null
                }
            }
        });
        const [createPlumResponse] = await productManager.createProduct({
            data: {
                title: "Plum",
                price: 100,
                availableOn: "2021-04-19",
                color: "white",
                availableSizes: ["s"],
                image: "plum.jpg",
                category: {
                    modelId: categoryModel.modelId,
                    id: fruitCategoryId
                }
            }
        });
        expect(createPlumResponse).toEqual({
            data: {
                createProduct: {
                    data: expect.any(Object),
                    error: null
                }
            }
        });

        const bananaProductUnpublished = createBananaResponse.data.createProduct.data;
        const plumProductUnpublished = createPlumResponse.data.createProduct.data;

        const [createTeslaResponse] = await productManager.createProduct({
            data: {
                title: "Tesla",
                price: 100,
                availableOn: "2021-04-19",
                color: "red",
                availableSizes: ["s", "m", "l"],
                image: "tesla.jpg",
                category: {
                    modelId: categoryModel.modelId,
                    id: carManufacturerCategoryId
                }
            }
        });
        expect(createTeslaResponse).toEqual({
            data: {
                createProduct: {
                    data: expect.any(Object),
                    error: null
                }
            }
        });
        const [createDaciaResponse] = await productManager.createProduct({
            data: {
                title: "Dacia",
                price: 100,
                availableOn: "2021-04-19",
                color: "black",
                availableSizes: ["s", "m"],
                image: "dacia.jpg",
                category: {
                    modelId: categoryModel.modelId,
                    id: carManufacturerCategoryId
                }
            }
        });
        expect(createDaciaResponse).toEqual({
            data: {
                createProduct: {
                    data: expect.any(Object),
                    error: null
                }
            }
        });

        const daciaProductUnpublished = createDaciaResponse.data.createProduct.data;
        const teslaProductUnpublished = createTeslaResponse.data.createProduct.data;

        const [publishBananaResponse] = await productManager.publishProduct({
            revision: bananaProductUnpublished.id
        });
        const [publishPlumResponse] = await productManager.publishProduct({
            revision: plumProductUnpublished.id
        });
        const [publishDaciaResponse] = await productManager.publishProduct({
            revision: daciaProductUnpublished.id
        });
        const [publishTeslaResponse] = await productManager.publishProduct({
            revision: teslaProductUnpublished.id
        });

        const bananaProduct = publishBananaResponse.data.publishProduct.data;
        const plumProduct = publishPlumResponse.data.publishProduct.data;
        const teslaProduct = publishTeslaResponse.data.publishProduct.data;
        const daciaProduct = publishDaciaResponse.data.publishProduct.data;

        /**
         * If this `until` resolves successfully, we know entry is accessible via the "read" API
         */
        await until(
            () => productReader.listProducts({}).then(([data]) => data),
            ({ data }: any) => {
                return data.listProducts.data.length === 4;
            },
            { name: "list all products" }
        );
        /*************************
         * MANAGERS
         **************************/
        /**
         * Test the equality operation on manage endpoint
         */
        const [equalManagerResponse] = await productManager.listProducts({
            where: {
                category: {
                    id: fruitCategoryId
                }
            },
            sort: ["title_ASC"]
        });

        expect(equalManagerResponse).toEqual({
            data: {
                listProducts: {
                    data: [bananaProduct, plumProduct],
                    meta: {
                        cursor: null,
                        hasMoreItems: false,
                        totalCount: 2
                    },
                    error: null
                }
            }
        });
        /**
         * Test the not_equality operation on manage endpoint
         */
        const [notEqualManagerResponse] = await productManager.listProducts({
            where: {
                category: {
                    id_not: fruitCategoryId
                }
            },
            sort: ["title_ASC"]
        });

        expect(notEqualManagerResponse).toEqual({
            data: {
                listProducts: {
                    data: [daciaProduct, teslaProduct],
                    meta: {
                        cursor: null,
                        hasMoreItems: false,
                        totalCount: 2
                    },
                    error: null
                }
            }
        });
        /**
         * Test the in operation on manage endpoint - single category
         */
        const [inManagerResponse] = await productManager.listProducts({
            where: {
                category: {
                    id_in: [carManufacturerCategoryId]
                }
            },
            sort: ["title_ASC"]
        });

        expect(inManagerResponse).toEqual({
            data: {
                listProducts: {
                    data: [daciaProduct, teslaProduct],
                    meta: {
                        cursor: null,
                        hasMoreItems: false,
                        totalCount: 2
                    },
                    error: null
                }
            }
        });
        /**
         * Test the not_in operation on manage endpoint - single category
         */
        const [notInManagerResponse] = await productManager.listProducts({
            where: {
                category: {
                    id_not_in: [carManufacturerCategoryId]
                }
            },
            sort: ["title_ASC"]
        });

        expect(notInManagerResponse).toEqual({
            data: {
                listProducts: {
                    data: [bananaProduct, plumProduct],
                    meta: {
                        cursor: null,
                        hasMoreItems: false,
                        totalCount: 2
                    },
                    error: null
                }
            }
        });
        /**
         * Test the in operation on manage endpoint - multiple categories
         */
        const [inMultipleManagerResponse] = await productManager.listProducts({
            where: {
                category: {
                    id_in: [fruitCategoryId, carManufacturerCategoryId]
                }
            },
            sort: ["title_ASC"]
        });

        expect(inMultipleManagerResponse).toEqual({
            data: {
                listProducts: {
                    data: [bananaProduct, daciaProduct, plumProduct, teslaProduct],
                    meta: {
                        cursor: null,
                        hasMoreItems: false,
                        totalCount: 4
                    },
                    error: null
                }
            }
        });
        /**
         * Test the not_in operation on manage endpoint - multiple categories
         */
        const [notInMultipleManagerResponse] = await productManager.listProducts({
            where: {
                category: {
                    id_not_in: [fruitCategoryId, carManufacturerCategoryId]
                }
            },
            sort: ["title_ASC"]
        });

        expect(notInMultipleManagerResponse).toEqual({
            data: {
                listProducts: {
                    data: [],
                    meta: {
                        cursor: null,
                        hasMoreItems: false,
                        totalCount: 0
                    },
                    error: null
                }
            }
        });

        delete daciaProduct["createdBy"];
        delete daciaProduct["meta"];
        daciaProduct.category = {
            id: carManufacturerCategoryId,
            title: "Car manufacturer"
        };
        delete teslaProduct["createdBy"];
        delete teslaProduct["meta"];
        teslaProduct.category = {
            id: carManufacturerCategoryId,
            title: "Car manufacturer"
        };
        delete bananaProduct["createdBy"];
        delete bananaProduct["meta"];
        bananaProduct.category = {
            id: fruitCategoryId,
            title: "Fruit category 123"
        };
        delete plumProduct["createdBy"];
        delete plumProduct["meta"];
        plumProduct.category = {
            id: fruitCategoryId,
            title: "Fruit category 123"
        };
        /**
         * Test the equal operation on read endpoint
         */
        const [equalReaderResponse] = await productReader.listProducts({
            where: {
                category: {
                    id: carManufacturerCategoryId
                }
            },
            sort: ["title_ASC"]
        });

        expect(equalReaderResponse).toEqual({
            data: {
                listProducts: {
                    data: [daciaProduct, teslaProduct],
                    meta: {
                        cursor: null,
                        hasMoreItems: false,
                        totalCount: 2
                    },
                    error: null
                }
            }
        });
        /**
         * Test the not_equal operation on read endpoint
         */
        const [notEqualReaderResponse] = await productReader.listProducts({
            where: {
                category: {
                    id_not: carManufacturerCategoryId
                }
            },
            sort: ["title_ASC"]
        });

        expect(notEqualReaderResponse).toEqual({
            data: {
                listProducts: {
                    data: [bananaProduct, plumProduct],
                    meta: {
                        cursor: null,
                        hasMoreItems: false,
                        totalCount: 2
                    },
                    error: null
                }
            }
        });
        /**
         * Test the in operation on read endpoint - single category
         */
        const [inReaderResponse] = await productReader.listProducts({
            where: {
                category: {
                    id_in: [fruitCategoryId]
                }
            },
            sort: ["title_ASC"]
        });

        expect(inReaderResponse).toEqual({
            data: {
                listProducts: {
                    data: [bananaProduct, plumProduct],
                    meta: {
                        cursor: null,
                        hasMoreItems: false,
                        totalCount: 2
                    },
                    error: null
                }
            }
        });
        /**
         * Test the not_in operation on read endpoint - single category
         */
        const [notInReaderResponse] = await productReader.listProducts({
            where: {
                category: {
                    id_not_in: [fruitCategoryId]
                }
            },
            sort: ["title_ASC"]
        });

        expect(notInReaderResponse).toEqual({
            data: {
                listProducts: {
                    data: [daciaProduct, teslaProduct],
                    meta: {
                        cursor: null,
                        hasMoreItems: false,
                        totalCount: 2
                    },
                    error: null
                }
            }
        });
        /**
         * Test the in operation on read endpoint - multiple categories
         */
        const [inMultipleReaderResponse] = await productReader.listProducts({
            where: {
                category: {
                    id_in: [fruitCategoryId, carManufacturerCategoryId]
                }
            },
            sort: ["title_ASC"]
        });

        expect(inMultipleReaderResponse).toEqual({
            data: {
                listProducts: {
                    data: [bananaProduct, daciaProduct, plumProduct, teslaProduct],
                    meta: {
                        cursor: null,
                        hasMoreItems: false,
                        totalCount: 4
                    },
                    error: null
                }
            }
        });
        /**
         * Test the not_in operation on read endpoint - multiple categories
         */
        const [notInMultipleReaderResponse] = await productReader.listProducts({
            where: {
                category: {
                    id_not_in: [fruitCategoryId, carManufacturerCategoryId]
                }
            },
            sort: ["title_ASC"]
        });

        expect(notInMultipleReaderResponse).toEqual({
            data: {
                listProducts: {
                    data: [],
                    meta: {
                        cursor: null,
                        hasMoreItems: false,
                        totalCount: 0
                    },
                    error: null
                }
            }
        });
    });

    test("should filter entries by empty datetime field", async () => {
        const categoryManager = useCategoryManageHandler(manageOpts);
        const productManager = useProductManageHandler(manageOpts);
        // const productReader = useProductReadHandler(readOpts);

        const group = await setupContentModelGroup(mainManager);
        const { category: categoryModel } = await setupContentModels(mainManager, group, [
            "category",
            "product"
        ]);

        const [createFruitResponse] = await categoryManager.createCategory({
            data: {
                title: "Fruit category 123",
                slug: "fruit-category-123"
            }
        });
        expect(createFruitResponse).toEqual({
            data: {
                createCategory: {
                    data: expect.any(Object),
                    error: null
                }
            }
        });
        const fruitCategoryId = createFruitResponse.data.createCategory.data.id;

        const [createBananaResponse] = await productManager.createProduct({
            data: {
                title: "Banana",
                price: 100,
                availableOn: "2021-04-19",
                color: "red",
                availableSizes: ["l"],
                image: "banana.jpg",
                category: {
                    modelId: categoryModel.modelId,
                    id: fruitCategoryId
                }
            }
        });
        expect(createBananaResponse).toMatchObject({
            data: {
                createProduct: {
                    data: {
                        id: expect.any(String)
                    },
                    error: null
                }
            }
        });
        const banana = createBananaResponse.data.createProduct.data;

        const [createPlumResponse] = await productManager.createProduct({
            data: {
                title: "Plum",
                price: 100,
                availableOn: "2021-04-22",
                color: "white",
                availableSizes: ["s"],
                image: "plum.jpg",
                category: {
                    modelId: categoryModel.modelId,
                    id: fruitCategoryId
                }
            }
        });
        expect(createPlumResponse).toMatchObject({
            data: {
                createProduct: {
                    data: {
                        id: expect.any(String)
                    },
                    error: null
                }
            }
        });
        const plum = createPlumResponse.data.createProduct.data;

        const [createAppleResponse] = await productManager.createProduct({
            data: {
                title: "Apple",
                price: 100,
                availableOn: null,
                color: "red",
                availableSizes: ["s"],
                image: "apple.jpg",
                category: {
                    modelId: categoryModel.modelId,
                    id: fruitCategoryId
                }
            }
        });
        expect(createAppleResponse).toMatchObject({
            data: {
                createProduct: {
                    data: {
                        id: expect.any(String)
                    },
                    error: null
                }
            }
        });
        const apple = createAppleResponse.data.createProduct.data;

        /**
         * Make sure that we have something in the list response
         */
        await until(
            () => productManager.listProducts().then(([data]) => data),
            ({ data }: any) => {
                return data.listProducts.data.length === 3;
            },
            { name: "list products after create" }
        );

        const [listNullResponse] = await productManager.listProducts({
            where: {
                availableOn: null
            },
            sort: ["createdOn_ASC"]
        });

        expect(listNullResponse).toEqual({
            data: {
                listProducts: {
                    data: [apple],
                    error: null,
                    meta: {
                        cursor: null,
                        hasMoreItems: false,
                        totalCount: 1
                    }
                }
            }
        });

        const [listNotNullResponse] = await productManager.listProducts({
            where: {
                availableOn_not: null
            },
            sort: ["createdOn_ASC"]
        });

        expect(listNotNullResponse).toEqual({
            data: {
                listProducts: {
                    data: [banana, plum],
                    error: null,
                    meta: {
                        cursor: null,
                        hasMoreItems: false,
                        totalCount: 2
                    }
                }
            }
        });
    });

    test("should filter entries by entryId", async () => {
        const articleManager = useArticleManageHandler(manageOpts);
        const articleReader = useArticleReadHandler(readOpts);

        const group = await setupContentModelGroup(mainManager);
        await setupContentModels(mainManager, group, ["category", "article"]);

        const [createFruitResponse] = await articleManager.createArticle({
            data: {
                title: "Fruit 123",
                body: null,
                categories: []
            }
        });

        const [createAnimalResponse] = await articleManager.createArticle({
            data: {
                title: "Animal 123",
                body: null,
                categories: []
            }
        });

        const [publishFruitResponse] = await articleManager.publishArticle({
            revision: createFruitResponse.data.createArticle.data.id
        });
        const fruit = publishFruitResponse.data.publishArticle.data;
        const [publishAnimalResponse] = await articleManager.publishArticle({
            revision: createAnimalResponse.data.createArticle.data.id
        });
        const animal = publishAnimalResponse.data.publishArticle.data;
        /**
         * Make sure we have both categories published.
         */
        await until(
            () => articleManager.listArticles().then(([data]) => data),
            ({ data }: any) => {
                const entries: any[] = data?.listArticles?.data || [];
                if (entries.length !== 2) {
                    return false;
                }
                return entries.every(entry => {
                    return !!entry.meta.publishedOn;
                });
            },
            { name: "list all published entries" }
        );
        /**
         * Make sure to get only the fruit entry via manage API.
         */
        const [listManageFruitResponse] = await articleManager.listArticles({
            where: {
                entryId: fruit.entryId
            }
        });

        expect(listManageFruitResponse).toEqual({
            data: {
                listArticles: {
                    data: [fruit],
                    meta: {
                        hasMoreItems: false,
                        totalCount: 1,
                        cursor: null
                    },
                    error: null
                }
            }
        });
        /**
         * Make sure to get only the animal entry via manage API.
         */
        const [listManageAnimalResponse] = await articleManager.listArticles({
            where: {
                entryId: animal.entryId
            }
        });

        expect(listManageAnimalResponse).toEqual({
            data: {
                listArticles: {
                    data: [animal],
                    meta: {
                        hasMoreItems: false,
                        totalCount: 1,
                        cursor: null
                    },
                    error: null
                }
            }
        });

        const readFruit = {
            ...fruit
        };
        delete readFruit["meta"];
        const readAnimal = {
            ...animal
        };
        delete readAnimal["meta"];

        /**
         * Make sure to get only the fruit entry via read API.
         * equal check
         */
        const [listReadFruitEqualResponse] = await articleReader.listArticles({
            where: {
                entryId: fruit.entryId
            }
        });

        expect(listReadFruitEqualResponse).toEqual({
            data: {
                listArticles: {
                    data: [readFruit],
                    meta: {
                        hasMoreItems: false,
                        totalCount: 1,
                        cursor: null
                    },
                    error: null
                }
            }
        });
        /**
         * Make sure to get only the animal entry via read API.
         * equal check
         */
        const [listReadAnimalEqualResponse] = await articleReader.listArticles({
            where: {
                entryId: animal.entryId
            }
        });

        expect(listReadAnimalEqualResponse).toEqual({
            data: {
                listArticles: {
                    data: [readAnimal],
                    meta: {
                        hasMoreItems: false,
                        totalCount: 1,
                        cursor: null
                    },
                    error: null
                }
            }
        });
        /**
         * Make sure to get only the fruit entry via read API.
         * not equal check
         */
        const [listReadFruitNotEqualResponse] = await articleReader.listArticles({
            where: {
                entryId_not: animal.entryId
            }
        });

        expect(listReadFruitNotEqualResponse).toEqual({
            data: {
                listArticles: {
                    data: [readFruit],
                    meta: {
                        hasMoreItems: false,
                        totalCount: 1,
                        cursor: null
                    },
                    error: null
                }
            }
        });
        /**
         * Make sure to get only the animal entry via read API.
         * not equal check
         */
        const [listReadAnimalNotEqualResponse] = await articleReader.listArticles({
            where: {
                entryId_not: fruit.entryId
            }
        });

        expect(listReadAnimalNotEqualResponse).toEqual({
            data: {
                listArticles: {
                    data: [readAnimal],
                    meta: {
                        hasMoreItems: false,
                        totalCount: 1,
                        cursor: null
                    },
                    error: null
                }
            }
        });
        /**
         * Make sure to get only the fruit entry via read API.
         * in check
         */
        const [listReadFruitInResponse] = await articleReader.listArticles({
            where: {
                entryId_in: [fruit.entryId]
            }
        });

        expect(listReadFruitInResponse).toEqual({
            data: {
                listArticles: {
                    data: [readFruit],
                    meta: {
                        hasMoreItems: false,
                        totalCount: 1,
                        cursor: null
                    },
                    error: null
                }
            }
        });
        /**
         * Make sure to get only the animal entry via read API.
         * in check
         */
        const [listReadAnimalInResponse] = await articleReader.listArticles({
            where: {
                entryId_in: [animal.entryId]
            }
        });

        expect(listReadAnimalInResponse).toEqual({
            data: {
                listArticles: {
                    data: [readAnimal],
                    meta: {
                        hasMoreItems: false,
                        totalCount: 1,
                        cursor: null
                    },
                    error: null
                }
            }
        });

        /**
         * Make sure to get only the fruit entry via read API.
         * not in check
         */
        const [listReadFruitNotInResponse] = await articleReader.listArticles({
            where: {
                entryId_not_in: [animal.entryId]
            }
        });

        expect(listReadFruitNotInResponse).toEqual({
            data: {
                listArticles: {
                    data: [readFruit],
                    meta: {
                        hasMoreItems: false,
                        totalCount: 1,
                        cursor: null
                    },
                    error: null
                }
            }
        });
        /**
         * Make sure to get only the animal entry via read API.
         * not in check
         */
        const [listReadAnimalNotInResponse] = await articleReader.listArticles({
            where: {
                entryId_not_in: [fruit.entryId]
            }
        });

        expect(listReadAnimalNotInResponse).toEqual({
            data: {
                listArticles: {
                    data: [readAnimal],
                    meta: {
                        hasMoreItems: false,
                        totalCount: 1,
                        cursor: null
                    },
                    error: null
                }
            }
        });

        /**
         * Make sure not to get both of the entries.
         * in check - all
         */
        const [listReadAnimalInAllResponse] = await articleReader.listArticles({
            where: {
                entryId_in: [fruit.entryId, animal.entryId]
            },
            sort: ["createdOn_ASC"]
        });

        expect(listReadAnimalInAllResponse).toEqual({
            data: {
                listArticles: {
                    data: [readFruit, readAnimal],
                    meta: {
                        hasMoreItems: false,
                        totalCount: 2,
                        cursor: null
                    },
                    error: null
                }
            }
        });

        /**
         * Make sure not to get any of the entries.
         * not in check - empty
         */
        const [listReadAnimalNotInAllResponse] = await articleReader.listArticles({
            where: {
                entryId_not_in: [fruit.entryId, animal.entryId]
            }
        });

        expect(listReadAnimalNotInAllResponse).toEqual({
            data: {
                listArticles: {
                    data: [],
                    meta: {
                        hasMoreItems: false,
                        totalCount: 0,
                        cursor: null
                    },
                    error: null
                }
            }
        });
    });

    test("should filter entries by createdBy", async () => {
        const articleManager = useArticleManageHandler(manageOpts);
        const articleAnotherManager = useArticleManageHandler({
            ...manageOpts,
            identity: {
                id: "87654321",
                displayName: "Jane Doe",
                type: "admin"
            }
        });

        const group = await setupContentModelGroup(mainManager);

        await setupContentModels(mainManager, group, ["category", "article"]);

        const [createFruitResponse] = await articleManager.createArticle({
            data: {
                title: "Fruit 123",
                body: null,
                categories: []
            }
        });

        const [createAnimalResponse] = await articleAnotherManager.createArticle({
            data: {
                title: "Animal 123",
                body: null,
                categories: []
            }
        });

        const [publishFruitResponse] = await articleManager.publishArticle({
            revision: createFruitResponse.data.createArticle.data.id
        });
        const fruit = publishFruitResponse.data.publishArticle.data;
        const [publishAnimalResponse] = await articleManager.publishArticle({
            revision: createAnimalResponse.data.createArticle.data.id
        });
        const animal = publishAnimalResponse.data.publishArticle.data;
        /**
         * Make sure we have both categories published.
         */
        await until(
            () => articleManager.listArticles().then(([data]) => data),
            ({ data }: any) => {
                const entries: any[] = data?.listArticles?.data || [];
                if (entries.length < 2) {
                    return false;
                }
                return entries.every(entry => {
                    return !!entry.meta.publishedOn;
                });
            },
            { name: "list all published entries" }
        );

        const [listEq123Response] = await articleManager.listArticles({
            where: {
                createdBy: "12345678"
            }
        });

        expect(listEq123Response).toEqual({
            data: {
                listArticles: {
                    data: [fruit],
                    meta: {
                        hasMoreItems: false,
                        totalCount: 1,
                        cursor: null
                    },
                    error: null
                }
            }
        });

        const [listEq4321Response] = await articleManager.listArticles({
            where: {
                createdBy: "87654321"
            }
        });

        expect(listEq4321Response).toEqual({
            data: {
                listArticles: {
                    data: [animal],
                    meta: {
                        hasMoreItems: false,
                        totalCount: 1,
                        cursor: null
                    },
                    error: null
                }
            }
        });

        const [listNotEqResponse] = await articleManager.listArticles({
            where: {
                createdBy_not: "12345678"
            }
        });

        expect(listNotEqResponse).toEqual({
            data: {
                listArticles: {
                    data: [animal],
                    meta: {
                        hasMoreItems: false,
                        totalCount: 1,
                        cursor: null
                    },
                    error: null
                }
            }
        });

        const [listInResponse] = await articleManager.listArticles({
            where: {
                createdBy_in: ["12345678"]
            }
        });

        expect(listInResponse).toEqual({
            data: {
                listArticles: {
                    data: [fruit],
                    meta: {
                        hasMoreItems: false,
                        totalCount: 1,
                        cursor: null
                    },
                    error: null
                }
            }
        });

        const [listNotInResponse] = await articleManager.listArticles({
            where: {
                createdBy_not_in: ["87654321"]
            }
        });

        expect(listNotInResponse).toEqual({
            data: {
                listArticles: {
                    data: [fruit],
                    meta: {
                        hasMoreItems: false,
                        totalCount: 1,
                        cursor: null
                    },
                    error: null
                }
            }
        });

        const [listNotInAllResponse] = await articleManager.listArticles({
            where: {
                createdBy_not_in: ["87654321", "12345678"]
            }
        });

        expect(listNotInAllResponse).toEqual({
            data: {
                listArticles: {
                    data: [],
                    meta: {
                        hasMoreItems: false,
                        totalCount: 0,
                        cursor: null
                    },
                    error: null
                }
            }
        });
    });

    test("should filter entries by ownedBy", async () => {
        const articleManager = useArticleManageHandler(manageOpts);
        const articleAnotherManager = useArticleManageHandler({
            ...manageOpts,
            identity: {
                id: "87654321",
                displayName: "Jane Doe",
                type: "admin"
            }
        });

        const group = await setupContentModelGroup(mainManager);
        await setupContentModels(mainManager, group, ["category", "article"]);

        const [createFruitResponse] = await articleManager.createArticle({
            data: {
                title: "Fruit 123",
                body: null,
                categories: []
            }
        });

        const [createAnimalResponse] = await articleAnotherManager.createArticle({
            data: {
                title: "Animal 123",
                body: null,
                categories: []
            }
        });

        const [publishFruitResponse] = await articleManager.publishArticle({
            revision: createFruitResponse.data.createArticle.data.id
        });
        const fruit = publishFruitResponse.data.publishArticle.data;
        const [publishAnimalResponse] = await articleManager.publishArticle({
            revision: createAnimalResponse.data.createArticle.data.id
        });
        const animal = publishAnimalResponse.data.publishArticle.data;
        /**
         * Make sure we have both categories published.
         */
        await until(
            () => articleManager.listArticles().then(([data]) => data),
            ({ data }: any) => {
                const entries: any[] = data?.listArticles?.data || [];
                if (entries.length !== 2) {
                    return false;
                }
                return entries.every(entry => {
                    return !!entry.meta.publishedOn;
                });
            },
            { name: "list all published entries" }
        );

        const [listEq123Response] = await articleManager.listArticles({
            where: {
                ownedBy: "12345678"
            }
        });

        expect(listEq123Response).toEqual({
            data: {
                listArticles: {
                    data: [fruit],
                    meta: {
                        hasMoreItems: false,
                        totalCount: 1,
                        cursor: null
                    },
                    error: null
                }
            }
        });

        const [listEq4321Response] = await articleManager.listArticles({
            where: {
                ownedBy: "87654321"
            }
        });

        expect(listEq4321Response).toEqual({
            data: {
                listArticles: {
                    data: [animal],
                    meta: {
                        hasMoreItems: false,
                        totalCount: 1,
                        cursor: null
                    },
                    error: null
                }
            }
        });

        const [listNotEqResponse] = await articleManager.listArticles({
            where: {
                ownedBy_not: "12345678"
            }
        });

        expect(listNotEqResponse).toEqual({
            data: {
                listArticles: {
                    data: [animal],
                    meta: {
                        hasMoreItems: false,
                        totalCount: 1,
                        cursor: null
                    },
                    error: null
                }
            }
        });

        const [listInResponse] = await articleManager.listArticles({
            where: {
                ownedBy_in: ["12345678"]
            }
        });

        expect(listInResponse).toEqual({
            data: {
                listArticles: {
                    data: [fruit],
                    meta: {
                        hasMoreItems: false,
                        totalCount: 1,
                        cursor: null
                    },
                    error: null
                }
            }
        });

        const [listNotInResponse] = await articleManager.listArticles({
            where: {
                ownedBy_not_in: ["87654321"]
            }
        });

        expect(listNotInResponse).toEqual({
            data: {
                listArticles: {
                    data: [fruit],
                    meta: {
                        hasMoreItems: false,
                        totalCount: 1,
                        cursor: null
                    },
                    error: null
                }
            }
        });

        const [listNotInAllResponse] = await articleManager.listArticles({
            where: {
                ownedBy_not_in: ["87654321", "12345678"]
            }
        });

        expect(listNotInAllResponse).toEqual({
            data: {
                listArticles: {
                    data: [],
                    meta: {
                        hasMoreItems: false,
                        totalCount: 0,
                        cursor: null
                    },
                    error: null
                }
            }
        });
    });

    it("should filter fruits by description", async () => {
        const { apple, banana, strawberry } = await setupFruits();
        const handler = useFruitReadHandler({
            ...readOpts
        });
        const { listFruits } = handler;

        await waitFruits("should filter fruits by description", handler);

        const [fruitsContainsResponse] = await listFruits({
            where: {
                description_contains: "fruit"
            },
            sort: ["createdOn_ASC"]
        });

        expect(fruitsContainsResponse).toMatchObject({
            data: {
                listFruits: {
                    data: [
                        {
                            id: apple.id,
                            name: apple.name,
                            description: apple.description
                        },
                        {
                            id: strawberry.id,
                            name: strawberry.name,
                            description: strawberry.description
                        },
                        {
                            id: banana.id,
                            name: banana.name,
                            description: banana.description
                        }
                    ],
                    error: null
                }
            }
        });

        const [fruitNotContainsResponse] = await listFruits({
            where: {
                description_not_contains: "fruit"
            },
            sort: ["createdOn_ASC"]
        });

        expect(fruitNotContainsResponse).toMatchObject({
            data: {
                listFruits: {
                    data: [],
                    error: null
                }
            }
        });

        const [bananaContainsResponse] = await listFruits({
            where: {
                description_contains: "banana"
            },
            sort: ["createdOn_ASC"]
        });

        expect(bananaContainsResponse).toMatchObject({
            data: {
                listFruits: {
                    data: [
                        {
                            id: banana.id,
                            name: banana.name,
                            description: banana.description
                        }
                    ],
                    error: null
                }
            }
        });

        const [appleNotContainsResponse] = await listFruits({
            where: {
                description_not_contains: "apple"
            },
            sort: ["createdOn_ASC"]
        });

        expect(appleNotContainsResponse).toMatchObject({
            data: {
                listFruits: {
                    data: [
                        {
                            id: strawberry.id,
                            name: strawberry.name,
                            description: strawberry.description
                        },
                        {
                            id: banana.id,
                            name: banana.name,
                            description: banana.description
                        }
                    ],
                    error: null
                }
            }
        });
    });
});
