import { ComplexEntity, SimpleEntity } from "./../entities/complexEntity";

describe("entity attribute test", () => {
    test("it must populate the attribute correctly (setToStorage enabled)", async () => {
        const entity = new ComplexEntity();
        entity.simpleEntities = [{ name: "Test-1" }, { name: "Test-2" }, { name: "Test-3" }];

        let simpleEntities = await entity.simpleEntities;
        expect(simpleEntities.length).toBe(3);
        expect(simpleEntities[0]).toBeInstanceOf(SimpleEntity);
        expect(simpleEntities[1]).toBeInstanceOf(SimpleEntity);
        expect(simpleEntities[2]).toBeInstanceOf(SimpleEntity);
        expect(simpleEntities[0].id).toBeNull();
        expect(simpleEntities[1].id).toBeNull();
        expect(simpleEntities[2].id).toBeNull();
        expect(simpleEntities[0].name).toEqual("Test-1");
        expect(simpleEntities[1].name).toEqual("Test-2");
        expect(simpleEntities[2].name).toEqual("Test-3");

        const simpleEntity1 = new SimpleEntity();
        simpleEntity1.name = "Test-1";

        const simpleEntity2 = new SimpleEntity();
        simpleEntity2.name = "Test-2";

        const simpleEntity3 = new SimpleEntity();
        simpleEntity3.name = "Test-3";

        entity.simpleEntities = [simpleEntity1, simpleEntity2, simpleEntity3];

        simpleEntities = await entity.simpleEntities;

        expect(simpleEntities.length).toBe(3);
        expect(simpleEntities[0]).toBeInstanceOf(SimpleEntity);
        expect(simpleEntities[1]).toBeInstanceOf(SimpleEntity);
        expect(simpleEntities[2]).toBeInstanceOf(SimpleEntity);
        expect(simpleEntities[0].id).toBeNull();
        expect(simpleEntities[1].id).toBeNull();
        expect(simpleEntities[2].id).toBeNull();
        expect(simpleEntities[0].name).toEqual("Test-1");
        expect(simpleEntities[1].name).toEqual("Test-2");
        expect(simpleEntities[2].name).toEqual("Test-3");

        entity.simpleEntities = null;
        expect(await entity.simpleEntities).toBeNull();
    });

    test("it null is set, it should accept it", async () => {
        const entity = new ComplexEntity();
        entity.simpleEntities = [{ name: "Test-1" }, { name: "Test-2" }, { name: "Test-3" }];
        entity.simpleEntities = null;
        expect(await entity.simpleEntities).toBeNull();
    });

    test("it should return correct toStorage data", async () => {
        let entity = new ComplexEntity();
        entity.simpleEntities = [
            { id: "54759eb3c090d83494e2d804", name: "Test-1" },
            { id: "54759eb3c090d83494e2d805", name: "Test-2" },
            { id: "54759eb3c090d83494e2d806", name: "Test-3" }
        ];

        let actual = await entity.toStorage();
        let expected = {
            simpleEntities: `["54759eb3c090d83494e2d804","54759eb3c090d83494e2d805","54759eb3c090d83494e2d806"]`
        };
        expect(actual).toEqual(expected);

        entity = new ComplexEntity();
        actual = await entity.toStorage();
        expected = {};
        expect(actual).toEqual(expected);
    });

    test("when setting storage value, attribute must not be set as dirty ", async () => {
        const entity = new ComplexEntity();
        const attribute = entity.getAttribute("simpleEntities");
        attribute.setStorageValue(
            `["54759eb3c090d83494e2d804","54759eb3c090d83494e2d805","54759eb3c090d83494e2d806"]`
        );
        expect(attribute.value.current).toEqual([
            "54759eb3c090d83494e2d804",
            "54759eb3c090d83494e2d805",
            "54759eb3c090d83494e2d806"
        ]);
        expect(attribute.value.isDirty()).toBe(false);
    });

    test("it should return null because no data was assigned", async () => {
        const entity = new ComplexEntity();
        expect(await entity.simpleEntity).toBeNull();
    });
});
