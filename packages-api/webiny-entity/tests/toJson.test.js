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
        assert.hasAllKeys(data, ["firstName", "age"]);
        assert.equal(data.firstName, "John");
        assert.equal(data.age, 12);

        data = await user.toJSON();
        assert.deepEqual(data, {});
    });

    it("should return empty object", async () => {
        const user = new User();

        user.firstName = "John";
        user.lastName = "Doe";
        user.age = 12;
        user.enabled = true;

        const data = await user.toJSON("firstName,age");
        assert.hasAllKeys(data, ["firstName", "age"]);
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
        assert.deepEqual(data, {});

        data = await mainEntity.toJSON("attribute1,attribute2");
        assert.deepEqual(data, {
            attribute1: [{ id: "AA" }, { id: 12 }],
            attribute2: [{ id: 13 }]
        });

        data = await mainEntity.toJSON(
            "attribute1.id,attribute1.name,attribute2[id,firstName,lastName,name]"
        );

        assert.deepEqual(data, {
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
});
