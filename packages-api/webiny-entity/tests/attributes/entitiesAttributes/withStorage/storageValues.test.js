import { assert } from "chai";
import { Entity, QueryResult } from "../../../../src/index";
import sinon from "sinon";
import EntityCollection from "../../../../src/entityCollection";

describe("attribute entities test", function() {
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

    it("should return correct storage values", async () => {
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

        sinon
            .stub(entity.getDriver(), "findById")
            .onCall(0)
            .callsFake(() => {
                return new QueryResult({ id: 10, name: "Bucky", type: "dog" });
            })
            .onCall(1)
            .callsFake(() => {
                return new QueryResult({ id: 11, firstName: "Foo", lastName: "Bar" });
            });

        const attribute1 = await mainEntity.attribute1;
        assert.lengthOf(attribute1, 3);
        assert.instanceOf(attribute1[0], Entity1);
        assert.instanceOf(attribute1[1], Entity1);
        assert.instanceOf(attribute1[2], Entity1);

        const attribute2 = await mainEntity.attribute2;
        assert.lengthOf(await attribute2, 2);
        assert.instanceOf(attribute2[0], Entity2);
        assert.instanceOf(attribute2[1], Entity2);

        const attribute1Value = await mainEntity.getAttribute("attribute1").getStorageValue();
        assert.equal(attribute1Value[0], "A");
        assert.equal(attribute1Value[1], "B");
        assert.equal(attribute1Value[2], "C");

        const attribute2Value = await mainEntity.getAttribute("attribute2").getStorageValue();
        assert.equal(attribute2Value[0], "X");
        assert.equal(attribute2Value[1], "Y");

        entity.getDriver().findById.restore();

        mainEntity.attribute1 = null;
        const attribute1NullValue = await mainEntity.getAttribute("attribute1").getStorageValue();
        assert.isEmpty(attribute1NullValue);
        assert.isEmpty(await mainEntity.attribute1);
        assert.instanceOf(await mainEntity.attribute1, EntityCollection);
    });

    it("should correctly set storage value", async () => {
        const mainEntity = new MainEntity();

        mainEntity.populateFromStorage({
            attribute1: ["A", "B"],
            attribute2: ["C"]
        });

        assert.equal(mainEntity.getAttribute("attribute1").value.getCurrent()[0], "A");
        assert.equal(mainEntity.getAttribute("attribute1").value.getCurrent()[1], "B");
        assert.equal(mainEntity.getAttribute("attribute2").value.getCurrent()[0], "C");

        sinon
            .stub(entity.getDriver(), "findByIds")
            .onCall(0)
            .callsFake(() => {
                return new QueryResult([
                    { id: "A", name: "Bucky", type: "dog" },
                    { id: "B", name: "Enlai", type: "dog" }
                ]);
            })
            .onCall(1)
            .callsFake(() => {
                return new QueryResult([{ id: "C", firstName: "Foo", lastName: "Bar" }]);
            });

        mainEntity.setExisting(true);

        const attribute1 = await mainEntity.attribute1;
        const attribute2 = await mainEntity.attribute2;

        entity.getDriver().findByIds.restore();

        assert.lengthOf(attribute1, 2);
        assert.equal(attribute1[0].id, "A");
        assert.equal(attribute1[1].id, "B");

        assert.equal(attribute2[0].id, "C");
    });
});
