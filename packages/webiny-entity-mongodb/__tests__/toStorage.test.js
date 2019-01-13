import { assert } from "chai";
import { ComplexEntity, SimpleEntity } from "./entities/complexEntity";

describe("toStorage test", function() {
    it("should correctly adapt the data for MongoDB", async () => {
        const complexEntity = new ComplexEntity();
        complexEntity.populate({
            firstName: "test",
            lastName: "tester",
            verification: {
                verified: true,
                documentType: "driversLicense"
            },
            tags: [
                { slug: "no-name", label: "No Name" },
                { slug: "adult-user", label: "Adult User" }
            ]
        });

        const simpleEntity1 = new SimpleEntity();
        simpleEntity1.id = "000000000000000000000001";
        simpleEntity1.name = "Test-1";

        complexEntity.simpleEntity = simpleEntity1;

        const simpleEntity2 = new SimpleEntity();
        simpleEntity2.id = "54759eb3c090d83494e2d804";
        simpleEntity2.name = "Test-2";

        const simpleEntity3 = new SimpleEntity();
        simpleEntity3.id = "54759eb3c090d83494e2d805";
        simpleEntity3.name = "Test-3";

        const simpleEntity4 = new SimpleEntity();
        simpleEntity4.id = "54759eb3c090d83494e2d806";
        simpleEntity4.name = "Test-4";

        complexEntity.simpleEntities = [simpleEntity2, simpleEntity3, simpleEntity4];

        const userStorageValue = await complexEntity.toStorage();

        assert.equal(userStorageValue.firstName, "test");
        assert.equal(userStorageValue.lastName, "tester");
        assert.deepEqual(
            userStorageValue.verification,
            {"verified":true,"documentType":"driversLicense"}
        );
        assert.deepEqual(
            userStorageValue.tags,
            [{"slug":"no-name","label":"No Name"},{"slug":"adult-user","label":"Adult User"}]
        );
        assert.equal(userStorageValue.simpleEntity, "000000000000000000000001");
        assert.deepEqual(
            userStorageValue.simpleEntities,
            ["54759eb3c090d83494e2d804","54759eb3c090d83494e2d805","54759eb3c090d83494e2d806"]
        );
    });
});
