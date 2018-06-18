import { Entity, QueryResult } from "../../../../src/index";
import sinon from "sinon";
const sandbox = sinon.sandbox.create();

describe("storage values test", () => {
    afterEach(() => sandbox.restore());
    beforeEach(() => Entity.getEntityPool().flush());

    class Entity1 extends Entity {
        constructor() {
            super();
            this.attr("name")
                .char()
                .setValidators("required");
            this.attr("number").integer();
            this.attr("type")
                .char()
                .setValidators("in:cat:dog:mouse:parrot");
        }
    }

    class Entity2 extends Entity {
        constructor() {
            super();
            this.attr("firstName")
                .char()
                .setValidators("required");
            this.attr("lastName")
                .char()
                .setValidators("required");
            this.attr("enabled").boolean();
        }
    }

    class MainEntity extends Entity {
        constructor() {
            super();
            this.attr("attribute1")
                .entities(Entity1)
                .setToStorage();
            this.attr("attribute2")
                .entities(Entity2)
                .setToStorage();
        }
    }

    const entity = new MainEntity();

    test("should return correct storage values", async () => {
        const mainEntity = new MainEntity();
        mainEntity.attribute1 = [
            { id: "A", name: "Enlai", type: "dog" },
            { id: "B", name: "Rocky", type: "dog" },
            {
                id: "C",
                name: "Lina",
                type: "bird"
            }
        ];
        mainEntity.attribute2 = [
            { id: "X", firstName: "John", lastName: "Doe" },
            { id: "Y", firstName: "Jane", lastName: "Doe" }
        ];

        sandbox
            .stub(entity.getDriver(), "findOne")
            .onCall(0)
            .callsFake(() => {
                return new QueryResult({ id: "A", name: "Bucky", type: "dog" });
            })
            .onCall(1)
            .callsFake(() => {
                return new QueryResult({ id: "B", name: "Rocky", type: "dog" });
            })
            .onCall(2)
            .callsFake(() => {
                return new QueryResult({ id: "C", name: "Lina", type: "bird" });
            })
            .onCall(3)
            .callsFake(() => {
                return new QueryResult({ id: "X", firstName: "John", type: "Doe" });
            })
            .onCall(4)
            .callsFake(() => {
                return new QueryResult({ id: "Y", firstName: "Joey", type: "Doe" });
            });

        const attribute1 = await mainEntity.attribute1;
        expect(attribute1.length).toBe(3);
        expect(attribute1[0]).toBeInstanceOf(Entity1);
        expect(attribute1[1]).toBeInstanceOf(Entity1);
        expect(attribute1[2]).toBeInstanceOf(Entity1);

        const attribute2 = await mainEntity.attribute2;
        expect(await attribute2.length).toBe(2);
        expect(attribute2[0]).toBeInstanceOf(Entity2);
        expect(attribute2[1]).toBeInstanceOf(Entity2);

        const attribute1Value = await mainEntity.getAttribute("attribute1").getStorageValue();
        expect(attribute1Value[0]).toEqual("A");
        expect(attribute1Value[1]).toEqual("B");
        expect(attribute1Value[2]).toEqual("C");

        const attribute2Value = await mainEntity.getAttribute("attribute2").getStorageValue();
        expect(attribute2Value[0]).toEqual("X");
        expect(attribute2Value[1]).toEqual("Y");

        entity.getDriver().findOne.restore();

        mainEntity.attribute1 = null;
        await mainEntity.attribute1;
        const attribute1NullValue = await mainEntity.getAttribute("attribute1").getStorageValue();
        expect(attribute1NullValue.length).toBe(0);
        expect(await mainEntity.attribute1).toBeNull();
    });

    test("should correctly set storage value", async () => {
        const mainEntity = new MainEntity();

        mainEntity.populateFromStorage({
            attribute1: ["A", "B"],
            attribute2: ["C"]
        });

        expect(mainEntity.getAttribute("attribute1").value.getCurrent()[0]).toEqual("A");
        expect(mainEntity.getAttribute("attribute1").value.getCurrent()[1]).toEqual("B");
        expect(mainEntity.getAttribute("attribute2").value.getCurrent()[0]).toEqual("C");

        sandbox
            .stub(entity.getDriver(), "findOne")
            .onCall(0)
            .callsFake(() => {
                return new QueryResult({ id: "A", name: "Bucky", type: "dog" });
            })
            .onCall(1)
            .callsFake(() => {
                return new QueryResult({ id: "B", name: "Enlai", type: "dog" });
            })
            .onCall(2)
            .callsFake(() => {
                return new QueryResult({ id: "C", firstName: "Foo", lastName: "Bar" });
            });

        mainEntity.setExisting(true);

        const attribute1 = await mainEntity.attribute1;
        const attribute2 = await mainEntity.attribute2;

        entity.getDriver().findOne.restore();

        expect(attribute1.length).toBe(2);
        expect(attribute1[0].id).toEqual("A");
        expect(attribute1[1].id).toEqual("B");

        expect(attribute2[0].id).toEqual("C");
    });
});
