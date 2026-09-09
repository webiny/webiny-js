import { describe, expect, it } from "vitest";
import { useFruitManageHandler } from "../testHelpers/useFruitManageHandler";
import type { Fruit } from "./mocks/contentModels";
import { setupGroupAndModels } from "../testHelpers/setup";
import { useGraphQLHandler } from "../testHelpers/useGraphQLHandler";

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

describe("updateRevisionDescription", () => {
    const manageOpts = { path: "manage" };
    const mainManager = useGraphQLHandler(manageOpts);

    const { createFruit, publishFruit, createFruitFrom, getFruit, updateFruitRevisionDescription } =
        useFruitManageHandler(manageOpts);

    it("should not wipe the latest revision values when updating description on an older revision", async () => {
        await setupGroupAndModels({ manager: mainManager, models: ["fruit"] });

        // 1. Create and publish revision #1.
        const [createResponse] = await createFruit({ data: bananaData });
        const rev1 = createResponse.data.createFruit.data;
        expect(rev1.values.name).toBe("Banana");

        await publishFruit({ revision: rev1.id });

        // 2. Create revision #2 from #1 (this is now the latest, #1 is locked).
        const [rev2Response] = await createFruitFrom({ revision: rev1.id });
        const rev2 = rev2Response.data.createFruitFrom.data;
        expect(rev2.id).toContain("#0002");
        expect(rev2.values.name).toBe("Banana");

        // 3. Update the revision description on the older revision (#1).
        const [updateDescResponse] = await updateFruitRevisionDescription({
            revision: rev1.id,
            revisionDescription: "This is a note on revision 1"
        });
        expect(updateDescResponse.data.updateFruitRevisionDescription.error).toBeNull();

        // 4. Fetch the latest revision (#2) and verify its values are intact.
        const [latestResponse] = await getFruit({ revision: rev2.id });
        const latestRevision = latestResponse.data.getFruit.data;

        expect(latestRevision.values.name).toBe("Banana");
        expect(latestRevision.values.rating).toBe(450);
        expect(latestRevision.values.email).toBe("john@doe.com");
        expect(latestRevision.values.description).toBe("fruit banana");
    });
});
