import { One, Two } from "../../entities/oneTwoThree";
import { QueryResult } from "../../../src";
import sinon from "sinon";
import { Entity1, MainEntity } from "../../entities/entitiesAttributeEntities";

const sandbox = sinon.sandbox.create();

describe("setValue test", () => {
    beforeEach(() => One.getEntityPool().flush());
    afterEach(() => sandbox.restore());

    test("should accept a valid ID", async () => {
        const entity = new MainEntity();
        entity.attribute1 = ["a", "b", "c"];
        expect(entity.getAttribute("attribute1").value.current).toEqual(["a", "b", "c"]);
        expect(entity.getAttribute("attribute1").value.initial.length).toBe(0);

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
        expect(entity.getAttribute("attribute1").value.state).toEqual({
            loading: false,
            loaded: false
        });

        expect(attribute1[0].id).toEqual("a");
        expect(attribute1[1].id).toEqual("b");
        expect(attribute1[2].id).toEqual("c");
        expect(entity.getAttribute("attribute1").value.state).toEqual({
            loading: false,
            loaded: false
        });

        entityFind.restore();
    });

    test("should accept an invalid ID and return it when trying to get attribute's value", async () => {
        const entity = new MainEntity();
        entity.attribute1 = ["a", "b", { id: "c" }];
        expect(entity.getAttribute("attribute1").value.current).toEqual(["a", "b", { id: "c" }]);
        expect(entity.getAttribute("attribute1").value.initial.length).toBe(0);

        let entityFindOne = sandbox.spy(Entity1.getDriver(), "findOne");

        const attribute1 = await entity.attribute1;
        expect(entity.getAttribute("attribute1").value.state).toEqual({
            loading: false,
            loaded: false
        });

        expect(attribute1[0]).toEqual("a");
        expect(attribute1[1]).toEqual("b");
        expect(attribute1[2].id).toEqual("c");
        expect(entity.getAttribute("attribute1").value.state).toEqual({
            loading: false,
            loaded: false
        });

        entityFindOne.restore();
    });

    test("should accept an object with a valid ID", async () => {
        const entity = new MainEntity();
        entity.attribute1 = [{ id: "a" }, { id: "b" }, { id: "c" }];
        expect(entity.getAttribute("attribute1").value.current).toEqual([
            { id: "a" },
            { id: "b" },
            { id: "c" }
        ]);
        expect(entity.getAttribute("attribute1").value.initial.length).toBe(0);

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
        expect(entity.getAttribute("attribute1").value.state).toEqual({
            loading: false,
            loaded: false
        });

        expect(attribute1[0].id).toEqual("a");
        expect(attribute1[1].id).toEqual("b");
        expect(attribute1[2].id).toEqual("c");
        expect(entity.getAttribute("attribute1").value.state).toEqual({
            loading: false,
            loaded: false
        });

        entityFind.restore();
    });

    test("should accept an invalid ID inside an object and return it when trying to get attribute's value", async () => {
        const entity = new MainEntity();
        entity.attribute1 = [{ id: "a" }, { id: "b" }, { id: "c" }];
        expect(entity.getAttribute("attribute1").value.current).toEqual([
            { id: "a" },
            { id: "b" },
            { id: "c" }
        ]);
        expect(entity.getAttribute("attribute1").value.initial.length).toBe(0);

        let entityFind = sandbox.spy(Entity1.getDriver(), "findOne");

        const attribute1 = await entity.attribute1;
        expect(entity.getAttribute("attribute1").value.state).toEqual({
            loading: false,
            loaded: false
        });

        expect(attribute1[0].id).toEqual("a");
        expect(attribute1[1].id).toEqual("b");
        expect(attribute1[2].id).toEqual("c");
        expect(entity.getAttribute("attribute1").value.state).toEqual({
            loading: false,
            loaded: false
        });

        entityFind.restore();
    });

    test("after loading from storage, loaded entity must be populated with received object data", async () => {
        const entity = new MainEntity();
        entity.attribute1 = [{ id: "a" }, { id: "b" }, { id: "c" }];
        expect(entity.getAttribute("attribute1").value.current).toEqual([
            { id: "a" },
            { id: "b" },
            { id: "c" }
        ]);
        expect(entity.getAttribute("attribute1").value.initial.length).toBe(0);

        const attribute1 = await entity.attribute1;
        expect(entity.getAttribute("attribute1").value.state).toEqual({
            loading: false,
            loaded: false
        });

        expect(attribute1[0].id).toEqual("a");
        expect(attribute1[1].id).toEqual("b");
        expect(attribute1[2].id).toEqual("c");
        expect(entity.getAttribute("attribute1").value.state).toEqual({
            loading: false,
            loaded: false
        });
    });
});
