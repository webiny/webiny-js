import { assert } from "chai";
import User from "./entities/user";

import sinon from "sinon";
import { MainEntity } from "./entities/entitiesAttributeEntities";
import { QueryResult } from "../src";

const sandbox = sinon.sandbox.create();

describe("toJSON test", function() {
    afterEach(() => sandbox.restore());

    it("should extract values correctly and return empty object it keys not specified", async () => {
        const user = new User();

        user.firstName = "John";
        user.lastName = "Doe";
        user.age = 12;
        user.enabled = true;

        let data = await user.toJSON("firstName,age");
        assert.hasAllKeys(data, ["id", "firstName", "age"]);
        assert.equal(data.firstName, "John");
        assert.equal(data.age, 12);

        data = await user.toJSON();
        assert.deepEqual(data, { id: null });
    });

    it("should return empty object", async () => {
        const user = new User();

        user.firstName = "John";
        user.lastName = "Doe";
        user.age = 12;
        user.enabled = true;

        const data = await user.toJSON("firstName,age");
        assert.hasAllKeys(data, ["id", "firstName", "age"]);
        assert.equal(data.firstName, "John");
        assert.equal(data.age, 12);
    });

    it("should not return whole entities, just attributes", async () => {
        const entityFind = sandbox
            .stub(MainEntity.getDriver(), "findOne")
            .onCall(0)
            .callsFake(() => {
                return new QueryResult({ id: 10 });
            });

        const mainEntity = await MainEntity.findById(123);
        entityFind.restore();

        const entitiesFind = sandbox
            .stub(MainEntity.getDriver(), "find")
            .onCall(0)
            .callsFake(() => {
                return new QueryResult([
                    { id: "AA", name: "Bucky", type: "dog" },
                    { id: 12, name: "Rocky", type: "dog" }
                ]);
            })
            .onCall(1)
            .callsFake(() => {
                return new QueryResult([{ id: 13, firstName: "Foo", lastName: "Bar" }]);
            });

        let data = await mainEntity.toJSON();
        assert.deepEqual(data, { id: 10 });

        data = await mainEntity.toJSON("attribute1,attribute2");
        assert.deepEqual(data, {
            id: 10,
            attribute1: [{ id: "AA" }, { id: 12 }],
            attribute2: [{ id: 13 }]
        });

        data = await mainEntity.toJSON(
            "attribute1.id,attribute1.name,attribute2[id,firstName,lastName,name]"
        );

        assert.deepEqual(data, {
            id: 10,
            attribute1: [
                {
                    id: "AA",
                    name: "Bucky"
                },
                {
                    id: 12,
                    name: "Rocky"
                }
            ],
            attribute2: [
                {
                    id: 13,
                    firstName: "Foo",
                    lastName: "Bar"
                }
            ]
        });

        entitiesFind.restore();
    });

    it("must always return 'id' field, no matter if it was specified or not", async () => {
        const [entity1, entity2, entity3] = [
            new User().populate({ id: "A", age: 30 }),
            new User().populate({ id: null, age: 35 }),
            new User().populate({ id: null, age: null })
        ];

        assert.deepEqual(await entity1.toJSON("id,age"), { id: "A", age: 30 });
        assert.deepEqual(await entity1.toJSON("age"), { id: "A", age: 30 });
        assert.deepEqual(await entity1.toJSON("id"), { id: "A" });
        assert.deepEqual(await entity1.toJSON(), { id: "A" });

        assert.deepEqual(await entity2.toJSON("id,age"), { id: null, age: 35 });
        assert.deepEqual(await entity2.toJSON("age"), { id: null, age: 35 });
        assert.deepEqual(await entity2.toJSON("id"), { id: null });
        assert.deepEqual(await entity2.toJSON(), { id: null });

        assert.deepEqual(await entity3.toJSON("id,age"), { id: null, age: null });
        assert.deepEqual(await entity3.toJSON("age"), { id: null, age: null });
        assert.deepEqual(await entity3.toJSON("id"), { id: null });
        assert.deepEqual(await entity3.toJSON(), { id: null });
    });

    it("should not return fields that does not exist", async () => {
        const user = new User().populate({ id: "A", age: 30 });
        const extract = await user.toJSON("age,username");
        assert.deepEqual(extract, { id: "A", age: 30 });
    });

    it("should pass arguments correctly", async () => {
        const user = new User();
        assert.equal(await user.getAttribute("dynamicWithArgs").getJSONValue(1, 2, 3), 6);
        assert.equal(await user.get("dynamicWithArgs:1:2:3"), "123");
        assert.deepEqual(await user.toJSON("dynamicWithArgs:1:2:3"), {
            id: null,
            dynamicWithArgs: "123"
        });
    });
});
