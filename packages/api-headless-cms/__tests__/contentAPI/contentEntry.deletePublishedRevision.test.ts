import { describe, expect, it } from "vitest";
import { useFruitManageHandler } from "../testHelpers/useFruitManageHandler";
import type { Fruit } from "./mocks/contentModels";
import { setupGroupAndModels } from "../testHelpers/setup";
import { useGraphQLHandler } from "../testHelpers/useGraphQLHandler";
import { getCmsModel } from "~tests/contentAPI/mocks/contentModels";

const bananaData: Fruit = {
    values: {
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
        description: "fruit banana"
    }
};

describe("delete published revision - live field", () => {
    const manageOpts = { path: "manage" };
    const mainManager = useGraphQLHandler(manageOpts);
    const model = getCmsModel("fruit");

    const { createFruit, publishFruit, createFruitFrom, deleteFruit } =
        useFruitManageHandler(manageOpts);

    const listFruitsWithLive = async () => {
        const query = /* GraphQL */ `
            query ListFruits {
                listFruits: list${model.pluralApiName}(limit: 100) {
                    data {
                        id
                        entryId
                        meta {
                            title
                            version
                            status
                        }
                        live {
                            version
                        }
                    }
                    error { message code }
                }
            }
        `;
        return mainManager.invoke({ body: { query } });
    };

    it("should clear live when deleting the published latest revision", async () => {
        await setupGroupAndModels({ manager: mainManager, models: ["fruit"] });

        // Create rev #1 and publish it.
        const [createRes] = await createFruit({ data: bananaData });
        const rev1 = createRes.data.createFruit.data;
        await publishFruit({ revision: rev1.id });

        // Create rev #2 from #1 (draft, not published).
        const [rev2Res] = await createFruitFrom({ revision: rev1.id });
        const rev2 = rev2Res.data.createFruitFrom.data;
        expect(rev2.meta.version).toBe(2);

        // Create rev #3 from #2 and publish it.
        const [rev3Res] = await createFruitFrom({ revision: rev2.id });
        const rev3 = rev3Res.data.createFruitFrom.data;
        expect(rev3.meta.version).toBe(3);

        const [pub3Res] = await publishFruit({ revision: rev3.id });
        expect(pub3Res.data.publishFruit.error).toBeNull();

        // Verify rev #3 is live.
        const [listBefore] = await listFruitsWithLive();
        const before = listBefore.data.listFruits.data.find(
            (e: { entryId: string }) => e.entryId === rev1.entryId
        );
        expect(before.live).toEqual({ version: 3 });

        // Delete rev #3.
        const [delRes] = await deleteFruit({ revision: rev3.id });
        expect(delRes.data.deleteFruit.error).toBeNull();

        // List entries — live should be cleared (no revision is published).
        const [listAfter] = await listFruitsWithLive();
        const after = listAfter.data.listFruits.data.find(
            (e: { entryId: string }) => e.entryId === rev1.entryId
        );
        expect(after).toBeDefined();
        expect(after.live).toBeNull();
    });

    it("should keep live when deleting a non-published draft revision", async () => {
        await setupGroupAndModels({ manager: mainManager, models: ["fruit"] });

        // Create rev #1 and publish it.
        const [createRes] = await createFruit({ data: bananaData });
        const rev1 = createRes.data.createFruit.data;
        await publishFruit({ revision: rev1.id });

        // Create rev #2 from #1 (draft, not published).
        const [rev2Res] = await createFruitFrom({ revision: rev1.id });
        const rev2 = rev2Res.data.createFruitFrom.data;

        // Create rev #3 from #2 and publish it.
        const [rev3Res] = await createFruitFrom({ revision: rev2.id });
        const rev3 = rev3Res.data.createFruitFrom.data;
        await publishFruit({ revision: rev3.id });

        // Delete the draft rev #2.
        const [delRes] = await deleteFruit({ revision: rev2.id });
        expect(delRes.data.deleteFruit.error).toBeNull();

        // List entries — rev #3 should still be live.
        const [listAfter] = await listFruitsWithLive();
        const after = listAfter.data.listFruits.data.find(
            (e: { entryId: string }) => e.entryId === rev1.entryId
        );
        expect(after).toBeDefined();
        expect(after.live).toEqual({ version: 3 });
    });
});
