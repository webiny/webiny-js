import { useFruitManageHandler } from "../testHelpers/useFruitManageHandler";
import { Fruit } from "./mocks/contentModels";
import { setupContentModelGroup, setupContentModels } from "../testHelpers/setup";
import { useGraphQLHandler } from "../testHelpers/useGraphQLHandler";

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
    description: "fruit named apple cms"
};

const greenAppleData: Fruit = {
    name: "Green-Apple",
    isSomething: false,
    rating: 400,
    numbers: [5, 6, 7.2, 10.18, 12.05],
    email: "john@doe.com",
    url: "https://apple.test",
    lowerCase: "greenapple",
    upperCase: "GREENAPPLE",
    date: "2020-12-15",
    dateTime: new Date("2020-12-15T12:12:21").toISOString(),
    dateTimeZ: "2020-12-15T14:52:41+01:00",
    time: "11:39:58",
    description: "fruit named green apple cms"
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
    description: "strawberry named fruit webiny"
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
    description: "fruit banana named cms webiny"
};

const orangeData: Fruit = {
    name: "Orange",
    isSomething: false,
    rating: 109001,
    numbers: [5, 6, 7.2, 10.18, 12.05],
    email: "orange@doe.com",
    url: "https://orange.test",
    lowerCase: "orange",
    upperCase: "ORANGE",
    date: "2020-12-04",
    dateTime: new Date("2020-12-04T12:12:21").toISOString(),
    dateTimeZ: "2020-12-03T14:52:41+01:00",
    time: "13:14:38",
    description: "fruit orange named"
};

type CmsEntry<T = Record<string, any>> = T & {
    name: string;
    meta: {
        status: string;
        modelId: string;
    };
};

describe("Content entries", () => {
    const manageOpts = { path: "manage/en-US" };

    const mainManager = useGraphQLHandler(manageOpts);

    const {
        createFruit,
        publishFruit,
        deleteFruit,
        listFruits,
        getFruit,
        getContentEntries,
        getLatestContentEntries,
        getPublishedContentEntries,
        getContentEntry,
        getLatestContentEntry,
        getPublishedContentEntry,
        createFruitFrom,
        searchContentEntries
    } = useFruitManageHandler({
        ...manageOpts
    });

    const createAndPublishFruit = async (data: any): Promise<CmsEntry<Required<Fruit>>> => {
        const [response] = await createFruit({
            data
        });

        const createdFruit = response.data.createFruit.data;

        if (response.data.createFruit.error) {
            throw new Error(response.data.createFruit.error.message);
        }

        const [publish] = await publishFruit({
            revision: createdFruit.id
        });
        if (publish.data.publishFruit.error) {
            throw new Error(publish.data.publishFruit.error.message);
        }

        return publish.data.publishFruit.data;
    };

    const createFruits = async () => {
        return {
            apple: await createAndPublishFruit(appleData),
            strawberry: await createAndPublishFruit(strawberryData),
            banana: await createAndPublishFruit(bananaData),
            orange: await createAndPublishFruit(orangeData),
            greenApple: await createAndPublishFruit(greenAppleData)
        };
    };

    const setupFruits = async () => {
        const group = await setupContentModelGroup(mainManager);
        await setupContentModels(mainManager, group, ["fruit"]);
        return createFruits();
    };
    it("should get content entry by modelId and id", async () => {
        const { apple, banana, strawberry } = await setupFruits();

        const [secondBananaResponse] = await createFruitFrom({
            revision: banana.id
        });
        expect(secondBananaResponse).toMatchObject({
            data: {
                createFruitFrom: {
                    data: {
                        id: `${banana.entryId}#0002`,
                        entryId: banana.entryId,
                        meta: {
                            version: 2,
                            status: "draft"
                        }
                    },
                    error: null
                }
            }
        });
        const secondBanana = secondBananaResponse.data.createFruitFrom.data;

        const [publishSecondBananaResponse] = await publishFruit({
            revision: secondBanana.id
        });
        expect(publishSecondBananaResponse).toMatchObject({
            data: {
                publishFruit: {
                    data: {
                        id: secondBanana.id,
                        entryId: banana.entryId,
                        meta: {
                            version: 2,
                            status: "published"
                        }
                    }
                }
            }
        });

        const [thirdBananaResponse] = await createFruitFrom({
            revision: secondBanana.id
        });
        expect(thirdBananaResponse).toMatchObject({
            data: {
                createFruitFrom: {
                    data: {
                        id: expect.stringMatching(/0003$/),
                        entryId: banana.entryId,
                        meta: {
                            version: 3,
                            status: "draft"
                        }
                    },
                    error: null
                }
            }
        });
        const thirdBanana = thirdBananaResponse.data.createFruitFrom.data;

        const [getThirdBananaResponse] = await getContentEntry({
            entry: {
                id: thirdBanana.id,
                modelId: banana.meta.modelId
            }
        });

        expect(getThirdBananaResponse).toMatchObject({
            data: {
                getContentEntry: {
                    data: {
                        id: thirdBanana.id,
                        title: thirdBanana.meta.title
                    }
                }
            }
        });

        /**
         * Exact entries queries.
         */
        const [exactAppleResponse] = await getContentEntry({
            entry: {
                id: apple.id,
                modelId: apple.meta.modelId
            }
        });

        expect(exactAppleResponse).toEqual({
            data: {
                getContentEntry: {
                    data: {
                        id: apple.id,
                        entryId: apple.entryId,
                        status: apple.meta.status,
                        title: apple.name,
                        description: apple.description,
                        image: null,
                        model: {
                            modelId: apple.meta.modelId,
                            name: "Fruit"
                        }
                    },
                    error: null
                }
            }
        });

        const [exactFruitsResponse] = await getContentEntries({
            entries: [
                {
                    id: apple.id,
                    modelId: apple.meta.modelId
                },
                {
                    id: banana.id,
                    modelId: banana.meta.modelId
                },
                {
                    id: strawberry.id,
                    modelId: strawberry.meta.modelId
                }
            ]
        });

        expect(exactFruitsResponse).toEqual({
            data: {
                getContentEntries: {
                    data: [
                        {
                            id: apple.id,
                            entryId: apple.entryId,
                            status: apple.meta.status,
                            title: apple.name,
                            description: apple.description,
                            image: null,
                            model: {
                                modelId: apple.meta.modelId,
                                name: "Fruit"
                            }
                        },
                        {
                            id: banana.id,
                            entryId: banana.entryId,
                            status: "unpublished",
                            title: banana.name,
                            description: banana.description,
                            image: null,
                            model: {
                                modelId: banana.meta.modelId,
                                name: "Fruit"
                            }
                        },
                        {
                            id: strawberry.id,
                            entryId: strawberry.entryId,
                            status: strawberry.meta.status,
                            title: strawberry.name,
                            description: strawberry.description,
                            image: null,
                            model: {
                                modelId: strawberry.meta.modelId,
                                name: "Fruit"
                            }
                        }
                    ],
                    error: null
                }
            }
        });

        /**
         * Latest entries queries.
         */
        const [latestBananaResponse] = await getLatestContentEntry({
            entry: {
                id: thirdBanana.id,
                modelId: thirdBanana.meta.modelId
            }
        });

        expect(latestBananaResponse).toEqual({
            data: {
                getLatestContentEntry: {
                    data: {
                        id: thirdBanana.id,
                        entryId: thirdBanana.entryId,
                        status: "draft",
                        title: thirdBanana.name,
                        description: thirdBanana.description,
                        image: null,
                        model: {
                            modelId: thirdBanana.meta.modelId,
                            name: "Fruit"
                        }
                    },
                    error: null
                }
            }
        });

        const [latestFruitsResponse] = await getLatestContentEntries({
            entries: [
                {
                    id: apple.id,
                    modelId: apple.meta.modelId
                },
                {
                    id: banana.id,
                    modelId: banana.meta.modelId
                },
                {
                    id: strawberry.id,
                    modelId: strawberry.meta.modelId
                }
            ]
        });

        expect(latestFruitsResponse).toEqual({
            data: {
                getLatestContentEntries: {
                    data: [
                        {
                            id: apple.id,
                            entryId: apple.entryId,
                            status: "published",
                            title: apple.name,
                            description: apple.description,
                            image: null,
                            model: {
                                modelId: apple.meta.modelId,
                                name: "Fruit"
                            }
                        },
                        {
                            id: thirdBanana.id,
                            entryId: thirdBanana.entryId,
                            status: "draft",
                            title: thirdBanana.name,
                            description: thirdBanana.description,
                            image: null,
                            model: {
                                modelId: thirdBanana.meta.modelId,
                                name: "Fruit"
                            }
                        },
                        {
                            id: strawberry.id,
                            entryId: strawberry.entryId,
                            status: "published",
                            title: strawberry.name,
                            description: strawberry.description,
                            image: null,
                            model: {
                                modelId: strawberry.meta.modelId,
                                name: "Fruit"
                            }
                        }
                    ],
                    error: null
                }
            }
        });
        /**
         * Published entries queries.
         */
        const [publishedBananaResponse] = await getPublishedContentEntry({
            entry: {
                id: thirdBanana.id,
                modelId: thirdBanana.meta.modelId
            }
        });

        expect(publishedBananaResponse).toEqual({
            data: {
                getPublishedContentEntry: {
                    data: {
                        id: secondBanana.id,
                        entryId: secondBanana.entryId,
                        status: "published",
                        title: secondBanana.name,
                        description: secondBanana.description,
                        image: null,
                        model: {
                            modelId: secondBanana.meta.modelId,
                            name: "Fruit"
                        }
                    },
                    error: null
                }
            }
        });

        const [publishedFruitsResponse] = await getPublishedContentEntries({
            entries: [
                {
                    id: apple.id,
                    modelId: apple.meta.modelId
                },
                {
                    id: banana.id,
                    modelId: banana.meta.modelId
                },
                {
                    id: strawberry.id,
                    modelId: strawberry.meta.modelId
                }
            ]
        });

        expect(publishedFruitsResponse).toEqual({
            data: {
                getPublishedContentEntries: {
                    data: [
                        {
                            id: apple.id,
                            entryId: apple.entryId,
                            status: "published",
                            title: apple.name,
                            description: apple.description,
                            image: null,
                            model: {
                                modelId: apple.meta.modelId,
                                name: "Fruit"
                            }
                        },
                        {
                            id: secondBanana.id,
                            entryId: secondBanana.entryId,
                            status: "published",
                            title: secondBanana.name,
                            description: secondBanana.description,
                            image: null,
                            model: {
                                modelId: secondBanana.meta.modelId,
                                name: "Fruit"
                            }
                        },
                        {
                            id: strawberry.id,
                            entryId: strawberry.entryId,
                            status: "published",
                            title: strawberry.name,
                            description: strawberry.description,
                            image: null,
                            model: {
                                modelId: strawberry.meta.modelId,
                                name: "Fruit"
                            }
                        }
                    ],
                    error: null
                }
            }
        });
    });

    it("should search for latest entries in given models", async () => {
        const { apple, banana, strawberry, orange, greenApple } = await setupFruits();

        const [secondBananaResponse] = await createFruitFrom({
            revision: banana.id
        });
        expect(secondBananaResponse).toMatchObject({
            data: {
                createFruitFrom: {
                    data: {
                        id: `${banana.entryId}#0002`,
                        entryId: banana.entryId,
                        meta: {
                            version: 2,
                            status: "draft"
                        }
                    },
                    error: null
                }
            }
        });

        const secondBanana = secondBananaResponse.data.createFruitFrom.data;

        const [response] = await searchContentEntries({
            modelsIds: ["fruit"]
        });

        expect(response).toMatchObject({
            data: {
                entries: {
                    data: [
                        {
                            id: secondBanana.id,
                            entryId: secondBanana.entryId,
                            title: secondBanana.name,
                            status: secondBanana.meta.status,
                            published: {
                                id: banana.id,
                                entryId: banana.entryId,
                                title: banana.name
                            }
                        },
                        {
                            id: greenApple.id,
                            entryId: greenApple.entryId,
                            title: greenApple.name,
                            status: greenApple.meta.status,
                            published: {
                                id: greenApple.id,
                                entryId: greenApple.entryId,
                                title: greenApple.name
                            }
                        },
                        {
                            id: orange.id,
                            entryId: orange.entryId,
                            title: orange.name,
                            status: orange.meta.status,
                            published: {
                                id: orange.id,
                                entryId: orange.entryId,
                                title: orange.name
                            }
                        },
                        {
                            id: strawberry.id,
                            entryId: strawberry.entryId,
                            title: strawberry.name,
                            status: strawberry.meta.status,
                            published: {
                                id: strawberry.id,
                                entryId: strawberry.entryId,
                                title: strawberry.name
                            }
                        },
                        {
                            id: apple.id,
                            entryId: apple.entryId,
                            title: apple.name,
                            status: apple.meta.status,
                            published: {
                                id: apple.id,
                                entryId: apple.entryId,
                                title: apple.name
                            }
                        }
                    ],
                    error: null
                }
            }
        });
    });

    const searchQueries: [string, string[]][] = [
        ["webiny", ["Banana", "Strawberry"]],
        ["cms", ["Green-Apple", "Banana", "Apple"]]
    ];

    it.each(searchQueries)(
        `should search for latest entries containing "%s" in given models`,
        async (query, titles) => {
            await setupFruits();

            const [response] = await searchContentEntries({
                modelsIds: ["fruit"],
                query
            });

            expect(response.data.entries.data).toHaveLength(titles.length);

            expect(response).toMatchObject({
                data: {
                    entries: {
                        data: titles.map(title => {
                            return {
                                title
                            };
                        }),
                        error: null
                    }
                }
            });
        }
    );

    it("should find an entry containing dash in the name", async () => {
        const { greenApple } = await setupFruits();

        const [response] = await searchContentEntries({
            modelsIds: ["fruit"],
            query: "green-apple"
        });

        expect(response).toMatchObject({
            data: {
                entries: {
                    data: [
                        {
                            id: greenApple.id,
                            title: greenApple.name
                        }
                    ],
                    error: null
                }
            }
        });
    });

    it("should process the delete of non existing entry", async () => {
        const { greenApple } = await setupFruits();
        /**
         * First we should delete the fruit.
         */
        const [deleteSuccessResponse] = await deleteFruit({
            revision: greenApple.entryId
        });
        expect(deleteSuccessResponse).toEqual({
            data: {
                deleteFruit: {
                    data: true,
                    error: null
                }
            }
        });
        /**
         * If we repeat the operation we should get the non existing entry error.
         */
        const [deleteFailResponse] = await deleteFruit({
            revision: greenApple.entryId
        });
        expect(deleteFailResponse).toMatchObject({
            data: {
                deleteFruit: {
                    data: null,
                    error: {
                        message: `Entry "${greenApple.entryId}" was not found!`
                    }
                }
            }
        });
        /**
         * And if we force deletion, we should get the success response.
         */
        const [deleteForceSuccessResponse] = await deleteFruit({
            revision: greenApple.entryId,
            options: {
                force: true
            }
        });
        expect(deleteForceSuccessResponse).toEqual({
            data: {
                deleteFruit: {
                    data: true,
                    error: null
                }
            }
        });
    });

    it("should process the delete of an entry, marking it as `deleted`", async () => {
        const fruits = await setupFruits();

        const { apple, banana, greenApple, strawberry, orange } = fruits;

        /**
         * First we check all fruits are loaded.
         */
        const [listSuccessResponse] = await listFruits({
            sort: ["name_ASC"]
        });
        expect(listSuccessResponse).toEqual({
            data: {
                listFruits: {
                    data: [apple, banana, greenApple, orange, strawberry],
                    error: null,
                    meta: {
                        cursor: null,
                        hasMoreItems: false,
                        totalCount: Object.keys(fruits).length
                    }
                }
            }
        });

        /**
         * Let's mark one fruit as deleted.
         */
        const [softDeleteSuccessResponse] = await deleteFruit({
            revision: greenApple.entryId,
            options: {
                permanently: false
            }
        });
        expect(softDeleteSuccessResponse).toEqual({
            data: {
                deleteFruit: {
                    data: true,
                    error: null
                }
            }
        });

        /**
         * If we repeat the operation, trying to mark it as deleted again, we should get the non existing entry error.
         */
        const [softDeleteFailResponse] = await deleteFruit({
            revision: greenApple.entryId,
            options: {
                permanently: false
            }
        });
        expect(softDeleteFailResponse).toMatchObject({
            data: {
                deleteFruit: {
                    data: null,
                    error: {
                        message: `Entry "${greenApple.entryId}" was not found!`
                    }
                }
            }
        });

        /**
         * Let's list the fruits again, we should not receive back the deleted fruit.
         */
        const [listAfterDeletionResponse] = await listFruits({
            sort: ["name_ASC"]
        });
        expect(listAfterDeletionResponse).toEqual({
            data: {
                listFruits: {
                    data: [apple, banana, orange, strawberry],
                    error: null,
                    meta: {
                        cursor: null,
                        hasMoreItems: false,
                        totalCount: Object.keys(fruits).length - 1
                    }
                }
            }
        });

        /**
         * Let's list the deleted fruits found in the bin.
         */
        const [listDeletedSuccessResponse] = await listFruits({ deleted: true });
        expect(listDeletedSuccessResponse).toEqual({
            data: {
                listFruits: {
                    data: [
                        {
                            ...greenApple,
                            meta: {
                                ...greenApple.meta,
                                // TODO: right now we are not adding a `deleted` flag to get single entry or revision, resulting an empty array.
                                revisions: []
                            },
                            deletedOn: expect.any(String),
                            deletedBy: expect.any(Object)
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
        /**
         * Let's try to get the deleted fruit, we should get the non existing entry error.
         */
        const [getAfterDeletionResponse] = await getFruit({ revision: greenApple.entryId });
        expect(getAfterDeletionResponse).toEqual({
            data: {
                getFruit: {
                    data: null,
                    error: {
                        code: "NOT_FOUND",
                        data: null,
                        message: `Entry by ID "${greenApple.entryId}" not found.`
                    }
                }
            }
        });

        /**
         * And if we force deletion, trying to destroy the entry, we should get the success response.
         */
        const [deleteSuccessResponse] = await deleteFruit({
            revision: greenApple.entryId
        });
        expect(deleteSuccessResponse).toEqual({
            data: {
                deleteFruit: {
                    data: true,
                    error: null
                }
            }
        });

        /**
         * If we repeat the operation we should get the non existing entry error.
         */
        const [deleteFailResponse] = await deleteFruit({
            revision: greenApple.entryId
        });
        expect(deleteFailResponse).toMatchObject({
            data: {
                deleteFruit: {
                    data: null,
                    error: {
                        message: `Entry "${greenApple.entryId}" was not found!`
                    }
                }
            }
        });

        /**
         * Let's list the deleted fruits aka the bin, it should be empty.
         */
        const [listDeletedFailResponse] = await listFruits({
            deleted: true
        });
        expect(listDeletedFailResponse).toEqual({
            data: {
                listFruits: {
                    data: [],
                    error: null,
                    meta: {
                        cursor: null,
                        hasMoreItems: false,
                        totalCount: 0
                    }
                }
            }
        });
    });
});
