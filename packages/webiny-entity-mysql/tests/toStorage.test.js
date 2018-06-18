import { ComplexEntity, SimpleEntity } from "./entities/complexEntity";

describe("toStorage test", () => {
    test("should correctly adapt the data for MySQL", async () => {
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

        expect(userStorageValue.firstName).toEqual("test");
        expect(userStorageValue.lastName).toEqual("tester");
        expect(userStorageValue.verification).toEqual(
            `{"verified":true,"documentType":"driversLicense"}`
        );
        expect(userStorageValue.tags).toEqual(
            `[{"slug":"no-name","label":"No Name"},{"slug":"adult-user","label":"Adult User"}]`
        );
        expect(userStorageValue.simpleEntity).toEqual("000000000000000000000001");
        expect(userStorageValue.simpleEntities).toEqual(
            `["54759eb3c090d83494e2d804","54759eb3c090d83494e2d805","54759eb3c090d83494e2d806"]`
        );
    });
});
