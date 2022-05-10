import { useFruitManageHandler } from "../utils/useFruitManageHandler";
// @ts-ignore
import mdbid from "mdbid";
import { CmsEntry, CmsModel } from "~/types";
import { setupContentModelGroup, setupContentModels } from "../utils/setup";

const NUMBER_OF_FRUITS = 200;

jest.setTimeout(100000);

const createFruitData = (counter: number): CmsEntry => {
    const entryId = mdbid();
    const id = `${entryId}#${String(counter).padStart(4, "0")}`;
    return {
        id,
        entryId,
        version: counter,
        webinyVersion: "version",
        modelId: "fruit",
        createdBy: {
            id: "admin",
            type: "admin",
            displayName: "Admin"
        },
        tenant: "root",
        publishedOn: new Date().toISOString(),
        locale: "en-US",
        ownedBy: {
            id: "admin",
            displayName: "Admin",
            type: "admin"
        },
        values: {
            name: `Fruit ${counter}`,
            isSomething: false,
            rating: 450,
            numbers: [5, 6, 7.2, 10.18, 12.05],
            email: "john@doe.com",
            url: `https://fruit.test/${counter}`,
            lowerCase: `fruit${counter}`,
            upperCase: `BANANA${counter}`,
            date: "2020-12-03",
            dateTime: new Date("2020-12-03T12:12:21").toISOString(),
            dateTimeZ: "2020-12-03T14:52:41+01:00",
            time: "11:59:01",
            description: `fruit ${counter}`,
            slug: `fruit-${counter}`
        },
        savedOn: new Date().toISOString(),
        createdOn: new Date().toISOString(),
        status: "draft",
        locked: false
    };
};

describe("entry pagination", () => {
    const manageOpts = { path: "manage/en-US" };

    let fruitContentModel: CmsModel;

    const manager = useFruitManageHandler(manageOpts);
    const { storageOperations, until } = manager;
    /**
     * We need to create N fruit entries
     */
    beforeEach(async () => {
        const group = await setupContentModelGroup(manager);
        await setupContentModels(manager, group, ["fruit"]);
        fruitContentModel = (await storageOperations.models.get({
            locale: "en-US",
            tenant: "root",
            modelId: "fruit"
        })) as CmsModel;
        for (let i = 1; i <= NUMBER_OF_FRUITS; i++) {
            const fruit = createFruitData(i);
            await storageOperations.entries.create(fruitContentModel, {
                storageEntry: fruit,
                entry: fruit
            });
        }
    });

    it("should paginate through entries", async () => {
        await until(
            () =>
                manager
                    .listFruits({
                        limit: 1
                    })
                    .then(([data]) => data),
            ({ data }: any) => {
                return data.listFruits.meta.totalCount === NUMBER_OF_FRUITS;
            },
            {
                name: "list all fruits",
                tries: 20,
                debounce: 2000,
                wait: 2000
            }
        );
        /**
         * List items from 0-37
         */
        const [list0x37Response] = await manager.listFruits({
            limit: 37,
            sort: ["createdOn_DESC"]
        });

        expect(list0x37Response).toMatchObject({
            data: {
                listFruits: {
                    data: expect.any(Array),
                    meta: {
                        totalCount: 200,
                        hasMoreItems: true,
                        cursor: expect.any(String)
                    },
                    error: null
                }
            }
        });

        expect(list0x37Response.data.listFruits.data).toHaveLength(37);
        /**
         * First item in data array should have version 200 - because we sort by createdOn_DESC
         */
        expect(list0x37Response.data.listFruits.data[0]).toMatchObject({
            meta: {
                version: 200
            }
        });

        const cursor0x37 = list0x37Response.data.listFruits.meta.cursor;
        /**
         * List items 37 - 109 (limit 72)
         */
        const [limit37x109Response] = await manager.listFruits({
            limit: 72,
            after: cursor0x37,
            sort: ["createdOn_DESC"]
        });

        expect(limit37x109Response).toMatchObject({
            data: {
                listFruits: {
                    data: expect.any(Array),
                    meta: {
                        totalCount: 200,
                        hasMoreItems: true,
                        cursor: expect.any(String)
                    },
                    error: null
                }
            }
        });
        expect(limit37x109Response.data.listFruits.data).toHaveLength(72);
        /**
         * First item in data array should have version 200 - 37
         */
        expect(limit37x109Response.data.listFruits.data[0]).toMatchObject({
            meta: {
                version: 163
            }
        });

        const cursor37x109 = limit37x109Response.data.listFruits.meta.cursor;

        /**
         * List items 109 - 211 (limit 102)
         */
        const [limit109x211Response] = await manager.listFruits({
            limit: 102,
            after: cursor37x109,
            sort: ["createdOn_DESC"]
        });

        expect(limit109x211Response).toMatchObject({
            data: {
                listFruits: {
                    data: expect.any(Array),
                    meta: {
                        totalCount: 200,
                        hasMoreItems: false,
                        cursor: null
                    },
                    error: null
                }
            }
        });
        expect(limit109x211Response.data.listFruits.data).toHaveLength(91);
        /**
         * First item in data array should have version 91
         */
        expect(limit109x211Response.data.listFruits.data[0]).toMatchObject({
            meta: {
                version: 91
            }
        });
        /**
         * Last item in data array should have version 1
         */
        expect(limit109x211Response.data.listFruits.data.concat([]).pop()).toMatchObject({
            meta: {
                version: 1
            }
        });

        /**
         * Next we will paginate with limit 8
         */
        const maxLimit8Runs = Math.ceil(NUMBER_OF_FRUITS / 8);
        let currentLimit8Run = 0;
        let limit8LastCursor = "";
        /**
         * We limit with max runs because of possible infinite loop. Just in case...
         */
        while (limit8LastCursor !== null && currentLimit8Run < maxLimit8Runs) {
            const [limit8Response] = await manager.listFruits({
                limit: 8,
                after: limit8LastCursor,
                sort: ["createdOn_DESC"]
            });
            expect(limit8Response).toMatchObject({
                data: {
                    listFruits: {
                        data: expect.any(Array),
                        meta: {
                            hasMoreItems: expect.any(Boolean),
                            totalCount: 200
                        }
                    }
                }
            });

            const firstItem = limit8Response.data.listFruits.data.concat([]).shift();
            const lastItem = limit8Response.data.listFruits.data.concat([]).pop();

            expect(firstItem).toMatchObject({
                meta: {
                    version: NUMBER_OF_FRUITS - currentLimit8Run * 8
                }
            });
            const lastVersion = NUMBER_OF_FRUITS - (currentLimit8Run + 1) * 8 + 1;
            expect(lastItem).toMatchObject({
                meta: {
                    version: lastVersion < 1 ? 1 : lastVersion
                }
            });
            limit8LastCursor = limit8Response.data.listFruits.meta.cursor;

            currentLimit8Run++;
        }
        /**
         * Last run (currentLimit8Run counter) should never be different than max runs.
         */
        expect(currentLimit8Run).toEqual(maxLimit8Runs);

        /**
         * Next we will paginate with limit 13
         */
        const maxLimit13Runs = Math.ceil(NUMBER_OF_FRUITS / 13);
        let currentLimit13Run = 0;
        let limit13LastCursor = "";
        /**
         * We limit with max runs because of possible infinite loop. Just in case...
         */
        while (limit13LastCursor !== null && currentLimit13Run < maxLimit13Runs) {
            const [limit13Response] = await manager.listFruits({
                limit: 13,
                after: limit13LastCursor,
                sort: ["createdOn_DESC"]
            });
            expect(limit13Response).toMatchObject({
                data: {
                    listFruits: {
                        data: expect.any(Array),
                        meta: {
                            hasMoreItems: expect.any(Boolean),
                            totalCount: 200
                        }
                    }
                }
            });

            const firstItem = limit13Response.data.listFruits.data.concat([]).shift();
            const lastItem = limit13Response.data.listFruits.data.concat([]).pop();

            expect(firstItem).toMatchObject({
                meta: {
                    version: NUMBER_OF_FRUITS - currentLimit13Run * 13
                }
            });
            const lastVersion = NUMBER_OF_FRUITS - (currentLimit13Run + 1) * 13 + 1;
            expect(lastItem).toMatchObject({
                meta: {
                    version: lastVersion < 1 ? 1 : lastVersion
                }
            });
            limit13LastCursor = limit13Response.data.listFruits.meta.cursor;

            currentLimit13Run++;
        }
        /**
         * Last run (currentLimit13Run counter) should never be different than max runs.
         */
        expect(currentLimit13Run).toEqual(maxLimit13Runs);
    });
});
