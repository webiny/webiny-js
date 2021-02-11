import { useFruitManageHandler } from "../utils/useFruitManageHandler";
import { useContentGqlHandler } from "../utils/useContentGqlHandler";
import { CmsContentModelGroup } from "@webiny/api-headless-cms/types";
import models from "./mocks/contentModels";
import { useFruitReadHandler } from "../utils/useFruitReadHandler";

jest.setTimeout(25000);

const appleData = {
    name: "Apple",
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
    name: "Strawberry",
    numbers: [5, 6, 7.2, 10.18, 12.05],
    email: "john@doe.com",
    url: "https://strawberry.test",
    lowerCase: "lowercase",
    upperCase: "UPPERCASE",
    date: "2020-12-18",
    dateTime: new Date("2020-12-19T12:12:21").toISOString(),
    dateTimeZ: "2020-12-25T14:52:41+01:00",
    time: "12:44:55"
};

const bananaData = {
    name: "Banana",
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

describe("elasticsearch filtering", () => {
    const esCmsIndex = "root-headless-cms";

    const manageOpts = { path: "manage/en-US" };
    const readOpts = { path: "read/en-US" };

    const {
        elasticSearch,
        createContentModelMutation,
        updateContentModelMutation,
        createContentModelGroupMutation
    } = useContentGqlHandler(manageOpts);

    const { until, createFruit, publishFruit } = useFruitManageHandler({
        ...manageOpts
    });

    // This function is not directly within `beforeEach` as we don't always setup the same content model.
    // We call this function manually at the beginning of each test, where needed.
    const setupContentModelGroup = async (): Promise<CmsContentModelGroup> => {
        const [createCMG] = await createContentModelGroupMutation({
            data: {
                name: "Group",
                slug: "group",
                icon: "ico/ico",
                description: "description"
            }
        });
        return createCMG.data.createContentModelGroup.data;
    };

    const setupContentModel = async (contentModelGroup: CmsContentModelGroup, name: string) => {
        const model = models.find(m => m.modelId === name);
        // Create initial record
        const [create] = await createContentModelMutation({
            data: {
                name: model.name,
                modelId: model.modelId,
                group: contentModelGroup.id
            }
        });

        if (create.errors) {
            console.error(`[beforeEach] ${create.errors[0].message}`);
            process.exit(1);
        } else if (create.data.createContentModel.data.error) {
            console.error(`[beforeEach] ${create.data.createContentModel.data.error.message}`);
            process.exit(1);
        }

        const [update] = await updateContentModelMutation({
            modelId: create.data.createContentModel.data.modelId,
            data: {
                fields: model.fields,
                layout: model.layout
            }
        });
        return update.data.updateContentModel.data;
    };
    const setupContentModels = async (contentModelGroup: CmsContentModelGroup) => {
        const models = {
            fruit: null
        };
        for (const name in models) {
            models[name] = await setupContentModel(contentModelGroup, name);
        }
        return models;
    };

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
        const group = await setupContentModelGroup();
        await setupContentModels(group);
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

    beforeEach(async () => {
        try {
            await elasticSearch.indices.create({ index: esCmsIndex });
        } catch {}
    });

    afterEach(async () => {
        try {
            await elasticSearch.indices.delete({ index: esCmsIndex });
        } catch {}
    });

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
                        cursor: expect.any(String),
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
                        cursor: expect.any(String),
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
                        cursor: expect.any(String),
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
                        cursor: expect.any(String),
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
                        cursor: expect.any(String),
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
                        cursor: expect.any(String),
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
                        cursor: expect.any(String),
                        hasMoreItems: false,
                        totalCount: 3
                    }
                }
            }
        });
    });
});
