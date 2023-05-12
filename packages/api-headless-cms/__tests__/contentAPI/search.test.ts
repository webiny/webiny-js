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

    const createFruits = async () => {
        const fruits = ["strawb-erry", "straw-berry", "strawberry"];

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

    const setupFruits = async () => {
        const group = await setupContentModelGroup(fruitManager);
        await setupContentModels(fruitManager, group, ["fruit"]);
        return createFruits();
    };

    it("should find record with dash in the middle of two words", async () => {
        await setupFruits();
        const [response] = await listFruits({
            where: {
                name_contains: "straw-berry"
            }
        });

        expect(response).toMatchObject({
            data: {
                listFruits: {
                    data: [
                        {
                            name: createName("straw-berry")
                        }
                    ],
                    error: null
                }
            }
        });
    });
});
