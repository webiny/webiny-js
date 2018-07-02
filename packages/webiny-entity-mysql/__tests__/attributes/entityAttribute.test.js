import { ComplexEntity, SimpleEntity } from "./../entities/complexEntity";

describe("entity attribute test", () => {
    test("it must populate the attribute correctly", async () => {
        const entity = new ComplexEntity();
        entity.simpleEntity = { name: "Test-1" };

        expect(await entity.simpleEntity).toBeInstanceOf(SimpleEntity);

        let linkedSimpleEntity = await entity.simpleEntity;
        expect(linkedSimpleEntity.id).toBeNull();
        expect(linkedSimpleEntity.name).toEqual("Test-1");

        const simpleEntity = new SimpleEntity();
        simpleEntity.name = "Test-2";

        entity.simpleEntity = simpleEntity;

        linkedSimpleEntity = await entity.simpleEntity;
        expect(linkedSimpleEntity).toBeInstanceOf(SimpleEntity);
        expect(linkedSimpleEntity.id).toBeNull();
        expect(linkedSimpleEntity.name).toEqual("Test-2");

        entity.simpleEntity = null;
        expect(await entity.simpleEntity).toBeNull();
    });

    test("it should return correct toStorage data", async () => {
        let entity = new ComplexEntity();
        entity.firstName = "firstName";
        entity.lastName = "lastName";
        entity.simpleEntity = { id: "01234567890123456789adee", name: "Test-1" };

        let actual = await entity.toStorage();
        let expected = {
            firstName: "firstName",
            lastName: "lastName",
            simpleEntity: "01234567890123456789adee"
        };
        expect(actual).toEqual(expected);
    });

    test("it should return null because no data was assigned", async () => {
        const entity = new ComplexEntity();
        expect(await entity.simpleEntity).toBeNull();
    });
});
