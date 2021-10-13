import { useContentGqlHandler } from "../utils/useContentGqlHandler";
import { useFruitManageHandler } from "../utils/useFruitManageHandler";
import { setupContentModelGroup, setupContentModels } from "../utils/setup";
import { useFruitReadHandler } from "../utils/useFruitReadHandler";

const appleData = {
    name: "Ap ` ple",
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
    time: "11:39:58"
};

const strawberryData = {
    name: "Straw ` berry",
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
    time: "12:44:55"
};

const bananaData = {
    name: "Ban ` ana",
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
    time: "11:59:01"
};

describe("sorting + cursor", () => {
    const manageOpts = { path: "manage/en-US" };
    const readOpts = { path: "read/en-US" };

    const mainManager = useContentGqlHandler(manageOpts);

    const { until, createFruit, publishFruit } = useFruitManageHandler({
        ...manageOpts
    });

    const filterOutFields = ["meta"];

    const createAndPublishFruit = async (data: any) => {
        const [response] = await createFruit({
            data
        });

        const createdFruit = response.data.createFruit.data;

        const [publish] = await publishFruit({
            revision: createdFruit.id
        });

        const fruit = publish.data.publishFruit.data;

        return Object.keys(fruit).reduce((acc, key) => {
            if (filterOutFields.includes(key)) {
                return acc;
            }
            acc[key] = fruit[key];
            return acc;
        }, {});
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
            () => listFruits({}).then(([data]) => data),
            ({ data }) => data.listFruits.data.length === 3,
            { name: "list all fruits", tries: 10 }
        );
    };

    test("should load items with after cursor with special characters", async () => {
        const { apple, banana, strawberry } = await setupFruits();

        const handler = useFruitReadHandler({
            ...readOpts
        });
        const { listFruits } = handler;

        await waitFruits("should filter fruits by date and sort asc", handler);

        const [appleListResponse] = await listFruits({
            sort: ["name_ASC"],
            limit: 1
        });

        expect(appleListResponse).toEqual({
            data: {
                listFruits: {
                    data: [
                        {
                            ...apple
                        }
                    ],
                    meta: {
                        hasMoreItems: true,
                        totalCount: 3,
                        cursor: expect.any(String)
                    },
                    error: null
                }
            }
        });

        const [bananaListResponse] = await listFruits({
            sort: ["name_ASC"],
            limit: 1,
            after: appleListResponse.data.listFruits.meta.cursor
        });

        expect(bananaListResponse).toEqual({
            data: {
                listFruits: {
                    data: [
                        {
                            ...banana
                        }
                    ],
                    meta: {
                        hasMoreItems: true,
                        totalCount: 3,
                        cursor: expect.any(String)
                    },
                    error: null
                }
            }
        });

        const [strawberryListResponse] = await listFruits({
            sort: ["name_ASC"],
            limit: 1,
            after: bananaListResponse.data.listFruits.meta.cursor
        });

        expect(strawberryListResponse).toEqual({
            data: {
                listFruits: {
                    data: [
                        {
                            ...strawberry
                        }
                    ],
                    meta: {
                        hasMoreItems: false,
                        totalCount: 3,
                        cursor: null
                    },
                    error: null
                }
            }
        });
    });
});
