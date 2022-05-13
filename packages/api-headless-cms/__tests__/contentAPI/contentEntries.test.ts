import { useFruitManageHandler } from "../utils/useFruitManageHandler";
import { Fruit } from "./mocks/contentModels";
import { setupContentModelGroup, setupContentModels } from "../utils/setup";
import { useContentGqlHandler } from "../utils/useContentGqlHandler";

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

    const mainManager = useContentGqlHandler(manageOpts);

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

    const createAndPublishFruit = async (data: any): Promise<CmsEntry<Fruit>> => {
        const [response] = await createFruit({
            data
        });

        const createdFruit = response.data.createFruit.data;

        const [publish] = await publishFruit({
            revision: createdFruit.id
        });

        return publish.data.publishFruit.data;
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

    const waitFruits = async (name: string, expectancy?: FruitExpectancy[]) => {
        // If this `until` resolves successfully, we know entry is accessible via the "read" API
        await until(
            () => listFruits({}).then(([data]) => data),
            ({ data }: any) => {
                const list: any[] = data.listFruits?.data || [];
                if (list.length !== 3) {
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
            }
        ]);

        await new Promise(resolve => {
            setTimeout(resolve, 5000);
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

    it("should search for latest entries in given models", async () => {
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
        ["cms", ["Banana", "Apple"]]
    ];

    it.each(searchQueries)(
        `should search for latest entries containing "%s" in given models`,
        async (query, titles) => {
            const { apple, banana, strawberry } = await setupFruits();

            await waitFruits("should be second banana as draft", [
                {
                    id: apple.id as string,
                    status: "published"
                },
                {
                    id: banana.id as string,
                    status: "published"
                },
                {
                    id: strawberry.id as string,
                    status: "published"
                }
            ]);

            const [response] = await searchContentEntries({
                modelsIds: ["fruit"],
                query
            });

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
});
