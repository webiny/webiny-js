import { useFruitManageHandler } from "~tests/testHelpers/useFruitManageHandler";
import { setupContentModelGroup, setupContentModels } from "~tests/testHelpers/setup";

describe("search", () => {
    const fruitManager = useFruitManageHandler({
        path: "manage/en-US"
    });
    const { createFruit, listFruits } = fruitManager;

    const createFruitRecord = async (data: any) => {
        const [response] = await createFruit({
            data
        });

        if (response.data.createFruit.error) {
            throw new Error(response.data.createFruit.error.message);
        }
        return response.data.createFruit.data;
    };

    const createName = (fruit: string): string => {
        return `A ${fruit} a`;
    };

    const createFruits = async (input?: string[]) => {
        const fruits = input || ["strawb-erry", "straw-berry", "strawberry"];

        return Promise.all(
            fruits.map(fruit => {
                return createFruitRecord({
                    name: createName(fruit),
                    date: "2020-12-15",
                    dateTime: new Date("2020-12-15T12:12:21").toISOString(),
                    dateTimeZ: "2020-12-15T14:52:41+01:00",
                    time: "11:39:58",
                    numbers: [5, 6, 7.2, 10.18, 12.05]
                });
            })
        );
    };

    const setupFruits = async (input?: string[]) => {
        const group = await setupContentModelGroup(fruitManager);
        await setupContentModels(fruitManager, group, ["fruit"]);
        return createFruits(input);
    };

    it("should find record with w/ in title", async () => {
        const fruits = {
            apple: "app w/ le",
            banana: "banana w/",
            orange: "w/ orange",
            grape: "gr w/ ape"
        };
        await setupFruits(Object.values(fruits));

        const [initialResponse] = await listFruits({
            sort: ["createdOn_ASC"]
        });
        expect(initialResponse).toMatchObject({
            data: {
                listFruits: {
                    data: expect.any(Array),
                    meta: {
                        totalCount: 4,
                        hasMoreItems: false,
                        cursor: null
                    },
                    error: null
                }
            }
        });
        /**
         * Apple
         */
        const [appleOnEnd] = await listFruits({
            where: {
                name_contains: "app w/"
            }
        });
        expect(appleOnEnd).toMatchObject({
            data: {
                listFruits: {
                    data: [
                        {
                            name: createName(fruits.apple)
                        }
                    ],
                    meta: {
                        totalCount: 1,
                        hasMoreItems: false,
                        cursor: null
                    },
                    error: null
                }
            }
        });

        const [appleOnStart] = await listFruits({
            where: {
                name_contains: "w/ le"
            }
        });
        expect(appleOnStart).toMatchObject({
            data: {
                listFruits: {
                    data: [
                        {
                            name: createName(fruits.apple)
                        }
                    ],
                    meta: {
                        totalCount: 1,
                        hasMoreItems: false,
                        cursor: null
                    },
                    error: null
                }
            }
        });

        const [appleInMiddle] = await listFruits({
            where: {
                name_contains: "p w/ l"
            }
        });
        expect(appleInMiddle).toMatchObject({
            data: {
                listFruits: {
                    data: [
                        {
                            name: createName(fruits.apple)
                        }
                    ],
                    meta: {
                        totalCount: 1,
                        hasMoreItems: false,
                        cursor: null
                    },
                    error: null
                }
            }
        });
        /**
         * Banana
         */
        const [bananaOnEnd] = await listFruits({
            where: {
                name_contains: "ana w/"
            }
        });
        expect(bananaOnEnd).toMatchObject({
            data: {
                listFruits: {
                    data: [
                        {
                            name: createName(fruits.banana)
                        }
                    ],
                    meta: {
                        totalCount: 1,
                        hasMoreItems: false,
                        cursor: null
                    },
                    error: null
                }
            }
        });

        const [bananaInMiddle] = await listFruits({
            where: {
                name_contains: "banana w/"
            }
        });
        expect(bananaInMiddle).toMatchObject({
            data: {
                listFruits: {
                    data: [
                        {
                            name: createName(fruits.banana)
                        }
                    ],
                    meta: {
                        totalCount: 1,
                        hasMoreItems: false,
                        cursor: null
                    },
                    error: null
                }
            }
        });
        /**
         * Orange
         */
        const [orangeOnStart] = await listFruits({
            where: {
                name_contains: "w/ ora"
            }
        });
        expect(orangeOnStart).toMatchObject({
            data: {
                listFruits: {
                    data: [
                        {
                            name: createName(fruits.orange)
                        }
                    ],
                    meta: {
                        totalCount: 1,
                        hasMoreItems: false,
                        cursor: null
                    },
                    error: null
                }
            }
        });

        const [orangeInMiddle] = await listFruits({
            where: {
                name_contains: "w/ orange"
            }
        });
        expect(orangeInMiddle).toMatchObject({
            data: {
                listFruits: {
                    data: [
                        {
                            name: createName(fruits.orange)
                        }
                    ],
                    meta: {
                        totalCount: 1,
                        hasMoreItems: false,
                        cursor: null
                    },
                    error: null
                }
            }
        });
        /**
         * Grape
         */
        const [grapeOnEnd] = await listFruits({
            where: {
                name_contains: "gr w/"
            }
        });
        expect(grapeOnEnd).toMatchObject({
            data: {
                listFruits: {
                    data: [
                        {
                            name: createName(fruits.grape)
                        }
                    ],
                    meta: {
                        totalCount: 1,
                        hasMoreItems: false,
                        cursor: null
                    },
                    error: null
                }
            }
        });

        const [grapeOnStart] = await listFruits({
            where: {
                name_contains: "w/ ape"
            }
        });
        expect(grapeOnStart).toMatchObject({
            data: {
                listFruits: {
                    data: [
                        {
                            name: createName(fruits.grape)
                        }
                    ],
                    meta: {
                        totalCount: 1,
                        hasMoreItems: false,
                        cursor: null
                    },
                    error: null
                }
            }
        });

        const [grapeInMiddle] = await listFruits({
            where: {
                name_contains: "r w/ ap"
            }
        });
        expect(grapeInMiddle).toMatchObject({
            data: {
                listFruits: {
                    data: [
                        {
                            name: createName(fruits.grape)
                        }
                    ],
                    meta: {
                        totalCount: 1,
                        hasMoreItems: false,
                        cursor: null
                    },
                    error: null
                }
            }
        });
    });
});
