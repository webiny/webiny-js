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

interface FruitExpectancy {
    id: string;
    status: string;
}

describe("Content entries", () => {
    const manageOpts = { path: "manage/en-US" };

    const mainManager = useGraphQLHandler(manageOpts);

    const {
        createFruit,
        publishFruit,
        listFruits,
        until,
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

    const waitFruits = async (name: string, expectancy?: FruitExpectancy[]) => {
        // If this `until` resolves successfully, we know entry is accessible via the "read" API
        await until(
            () => listFruits({}).then(([data]) => data),
            ({ data }: any) => {
                const list: any[] = data.listFruits?.data || [];
                if (list.length !== 5) {
                    return false;
                }
                if (!expectancy) {
                    return true;
                }
                return expectancy.every(item => {
                    return list.some(ls => {
                        return ls.id === item.id && ls.meta.status === item.status;
                    });
                });
            },
            { name: `list all fruits - ${name}` }
        );
    };

    it.skip("should get content entry by modelId and id", async () => {
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
                        id: (secondBanana.id || "").replace("0002", "0003"),
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

        await waitFruits("should filter fruits by date and sort asc", [
            {
                id: apple.id,
                status: "published"
            },
            {
                id: thirdBanana.id,
                status: "draft"
            },
            {
                id: strawberry.id,
                status: "published"
            },
            {
                id: orange.id,
                status: "published"
            },
            {
                id: greenApple.id,
                status: "published"
            }
        ]);

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

    it.skip("should search for latest entries in given models", async () => {
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

        await waitFruits("should be second banana as draft", [
            {
                id: apple.id,
                status: "published"
            },
            {
                id: secondBanana.id,
                status: "draft"
            },
            {
                id: strawberry.id,
                status: "published"
            },
            {
                id: orange.id,
                status: "published"
            }
        ]);

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

    it.skip.each(searchQueries)(
        `should search for latest entries containing "%s" in given models`,
        async (query, titles) => {
            const { apple, banana, strawberry, orange, greenApple } = await setupFruits();

            await waitFruits("should be second banana as draft", [
                {
                    id: apple.id,
                    status: "published"
                },
                {
                    id: banana.id,
                    status: "published"
                },
                {
                    id: strawberry.id,
                    status: "published"
                },
                {
                    id: orange.id,
                    status: "published"
                },
                {
                    id: greenApple.id,
                    status: "published"
                }
            ]);

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
});
