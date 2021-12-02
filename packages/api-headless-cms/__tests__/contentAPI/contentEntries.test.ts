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
    description: "fruit named apple"
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
    description: "strawberry named fruit"
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
    description: "fruit banana named"
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

    const mainManager = useContentGqlHandler(manageOpts);

    const { createFruit, publishFruit, listFruits, until, getContentEntries, getContentEntry } =
        useFruitManageHandler({
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

    const waitFruits = async (name: string) => {
        // If this `until` resolves successfully, we know entry is accessible via the "read" API
        await until(
            () => listFruits({}).then(([data]) => data),
            ({ data }) => data.listFruits.data.length === 3,
            { name: `list all fruits - ${name}` }
        );
    };

    it("should get content entry by modelId and id", async () => {
        const { apple, banana, strawberry } = await setupFruits();

        await waitFruits("should filter fruits by date and sort asc");

        const [appleResponse] = await getContentEntry({
            entry: {
                id: apple.id,
                modelId: apple.meta.modelId
            }
        });

        expect(appleResponse).toEqual({
            data: {
                getContentEntry: {
                    data: {
                        id: apple.id,
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

        const [fruitsResponse] = await getContentEntries({
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

        expect(fruitsResponse).toEqual({
            data: {
                getContentEntries: {
                    data: [
                        {
                            id: apple.id,
                            status: apple.meta.status,
                            title: apple.name,
                            model: {
                                modelId: apple.meta.modelId,
                                name: "Fruit"
                            }
                        },
                        {
                            id: banana.id,
                            status: banana.meta.status,
                            title: banana.name,
                            model: {
                                modelId: banana.meta.modelId,
                                name: "Fruit"
                            }
                        },
                        {
                            id: strawberry.id,
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
    });
});
