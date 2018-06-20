import { ComplexEntity, SimpleEntity } from "./entities/complexEntity";

describe("toStorage test", () => {
    test("should correctly adapt the data for Memory", async () => {
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
        simpleEntity1.id = "A";
        simpleEntity1.name = "Test-1";

        complexEntity.simpleEntity = simpleEntity1;

        const simpleEntity2 = new SimpleEntity();
        simpleEntity2.id = "B";
        simpleEntity2.name = "Test-2";

        const simpleEntity3 = new SimpleEntity();
        simpleEntity3.id = "C";
        simpleEntity3.name = "Test-3";

        const simpleEntity4 = new SimpleEntity();
        simpleEntity4.id = "D";
        simpleEntity4.name = "Test-4";

        const userStorageValue = await complexEntity.toStorage();

        expect(userStorageValue.firstName).toEqual("test");
        expect(userStorageValue.lastName).toEqual("tester");
        expect(userStorageValue.verification).toEqual({
            verified: true,
            documentType: "driversLicense"
        });
        expect(userStorageValue.tags).toEqual([
            { slug: "no-name", label: "No Name" },
            { slug: "adult-user", label: "Adult User" }
        ]);
        expect(userStorageValue.simpleEntity).toEqual("A");
    });
});
