import { assert } from "chai";
import { One, Two } from "../../../entities/oneTwoThree";
import { QueryResult } from "../../../../src";
import sinon from "sinon";
import { Entity1, MainEntity } from "../../../entities/entitiesAttributeEntities";

const sandbox = sinon.sandbox.create();

describe("setValue test", function() {
    beforeEach(() => One.getEntityPool().flush());
    afterEach(() => sandbox.restore());

    it("should accept a valid ID and load before save", async () => {
        const entity = new MainEntity();
        entity.attribute1 = ["a", "b", "c"];

        let entityFind = sandbox
            .stub(Entity1.getDriver(), "findOne")
            .onCall(0)
            .callsFake(() => {
                return new QueryResult({
                    id: "a",
                    name: "A",
                    type: "dog",
                    markedAsCannotDelete: false
                });
            })
            .onCall(1)
            .callsFake(() => {
                return new QueryResult({
                    id: "b",
                    name: "B",
                    type: "dog",
                    markedAsCannotDelete: false
                });
            })
            .onCall(2)
            .callsFake(() => {
                return new QueryResult({
                    id: "c",
                    name: "C",
                    type: "dog",
                    markedAsCannotDelete: false
                });
            });

        await entity.save();

        const attribute1Value = await entity.attribute1;
        assert.instanceOf(attribute1Value[0], Entity1);
        assert.instanceOf(attribute1Value[1], Entity1);
        assert.instanceOf(attribute1Value[2], Entity1);

        assert.equal(attribute1Value[0].id, "a");
        assert.equal(attribute1Value[1].id, "b");
        assert.equal(attribute1Value[2].id, "c");

        entityFind.restore();
    });

    it("after loading from storage, loaded entity must be populated with received object data", async () => {
        const entity = new MainEntity();
        entity.attribute1 = [
            { id: "a", name: "updated_a" },
            { id: "b", name: "updated_b" },
            { id: "c", name: "updated_c" }
        ];

        let entityFind = sandbox
            .stub(Entity1.getDriver(), "findOne")
            .onCall(0)
            .callsFake(() => {
                return new QueryResult({
                    id: "a",
                    name: "A",
                    type: "dog",
                    markedAsCannotDelete: false
                });
            })
            .onCall(1)
            .callsFake(() => {
                return new QueryResult({
                    id: "b",
                    name: "B",
                    type: "dog",
                    markedAsCannotDelete: false
                });
            })
            .onCall(2)
            .callsFake(() => {
                return new QueryResult({
                    id: "c",
                    name: "C",
                    type: "dog",
                    markedAsCannotDelete: false
                });
            });

        await entity.save();

        const attribute1Value = await entity.attribute1;
        assert.instanceOf(attribute1Value[0], Entity1);
        assert.instanceOf(attribute1Value[1], Entity1);
        assert.instanceOf(attribute1Value[2], Entity1);

        assert.equal(attribute1Value[0].id, "a");
        assert.equal(attribute1Value[1].id, "b");
        assert.equal(attribute1Value[2].id, "c");

        assert.equal(attribute1Value[0].name, "updated_a");
        assert.equal(attribute1Value[1].name, "updated_b");
        assert.equal(attribute1Value[2].name, "updated_c");

        entityFind.restore();
    });
});
