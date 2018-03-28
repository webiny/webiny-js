import { assert } from "chai";
import { One, Two } from "../../entities/oneTwoThree";
import { QueryResult } from "../../../src";
import sinon from "sinon";
import { Entity1, MainEntity } from "../../entities/entitiesAttributeEntities";

const sandbox = sinon.sandbox.create();

describe("setValue test", function() {
    beforeEach(() => One.getEntityPool().flush());
    afterEach(() => sandbox.restore());

    it("should accept a valid ID", async () => {
        const entity = new MainEntity();
        entity.attribute1 = ["a", "b", "c"];
        assert.deepEqual(entity.getAttribute("attribute1").value.current, ["a", "b", "c"]);
        assert.deepEqual(entity.getAttribute("attribute1").value.initial, []);

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

        const attribute1 = await entity.attribute1;
        assert.deepEqual(entity.getAttribute("attribute1").value.state, {
            loading: false,
            loaded: false
        });

        assert.equal(attribute1[0].id, "a");
        assert.equal(attribute1[1].id, "b");
        assert.equal(attribute1[2].id, "c");
        assert.deepEqual(entity.getAttribute("attribute1").value.state, {
            loading: false,
            loaded: false
        });

        entityFind.restore();
    });

    it("should accept an invalid ID and return it when trying to get attribute's value", async () => {
        const entity = new MainEntity();
        entity.attribute1 = ["a", "b", { id: "c" }];
        assert.deepEqual(entity.getAttribute("attribute1").value.current, ["a", "b", { id: "c" }]);
        assert.deepEqual(entity.getAttribute("attribute1").value.initial, []);

        let entityFindOne = sandbox.spy(Entity1.getDriver(), "findOne");

        const attribute1 = await entity.attribute1;
        assert.deepEqual(entity.getAttribute("attribute1").value.state, {
            loading: false,
            loaded: false
        });

        assert.equal(attribute1[0], "a");
        assert.equal(attribute1[1], "b");
        assert.equal(attribute1[2].id, "c");
        assert.deepEqual(entity.getAttribute("attribute1").value.state, {
            loading: false,
            loaded: false
        });

        entityFindOne.restore();
    });

    it("should accept an object with a valid ID", async () => {
        const entity = new MainEntity();
        entity.attribute1 = [{ id: "a" }, { id: "b" }, { id: "c" }];
        assert.deepEqual(entity.getAttribute("attribute1").value.current, [
            { id: "a" },
            { id: "b" },
            { id: "c" }
        ]);
        assert.deepEqual(entity.getAttribute("attribute1").value.initial, []);

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

        const attribute1 = await entity.attribute1;
        assert.deepEqual(entity.getAttribute("attribute1").value.state, {
            loading: false,
            loaded: false
        });

        assert.equal(attribute1[0].id, "a");
        assert.equal(attribute1[1].id, "b");
        assert.equal(attribute1[2].id, "c");
        assert.deepEqual(entity.getAttribute("attribute1").value.state, {
            loading: false,
            loaded: false
        });

        entityFind.restore();
    });

    it("should accept an invalid ID inside an object and return it when trying to get attribute's value", async () => {
        const entity = new MainEntity();
        entity.attribute1 = [{ id: "a" }, { id: "b" }, { id: "c" }];
        assert.deepEqual(entity.getAttribute("attribute1").value.current, [
            { id: "a" },
            { id: "b" },
            { id: "c" }
        ]);
        assert.deepEqual(entity.getAttribute("attribute1").value.initial, []);

        let entityFind = sandbox.spy(Entity1.getDriver(), "findOne");

        const attribute1 = await entity.attribute1;
        assert.deepEqual(entity.getAttribute("attribute1").value.state, {
            loading: false,
            loaded: false
        });

        assert.equal(attribute1[0].id, "a");
        assert.equal(attribute1[1].id, "b");
        assert.equal(attribute1[2].id, "c");
        assert.deepEqual(entity.getAttribute("attribute1").value.state, {
            loading: false,
            loaded: false
        });

        entityFind.restore();
    });

    it("after loading from storage, loaded entity must be populated with received object data", async () => {
        const entity = new MainEntity();
        entity.attribute1 = [{ id: "a" }, { id: "b" }, { id: "c" }];
        assert.deepEqual(entity.getAttribute("attribute1").value.current, [
            { id: "a" },
            { id: "b" },
            { id: "c" }
        ]);
        assert.deepEqual(entity.getAttribute("attribute1").value.initial, []);

        const attribute1 = await entity.attribute1;
        assert.deepEqual(entity.getAttribute("attribute1").value.state, {
            loading: false,
            loaded: false
        });

        assert.equal(attribute1[0].id, "a");
        assert.equal(attribute1[1].id, "b");
        assert.equal(attribute1[2].id, "c");
        assert.deepEqual(entity.getAttribute("attribute1").value.state, {
            loading: false,
            loaded: false
        });
    });
});
