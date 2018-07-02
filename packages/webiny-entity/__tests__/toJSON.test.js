import User from "./entities/user";

import sinon from "sinon";
import { MainEntity } from "./entities/entitiesAttributeEntities";
import { QueryResult } from "webiny-entity";

const sandbox = sinon.sandbox.create();

describe("toJSON test", () => {
    afterEach(() => sandbox.restore());

    test("should extract values correctly and return empty object it keys not specified", async () => {
        const user = new User();

        user.firstName = "John";
        user.lastName = "Doe";
        user.age = 12;
        user.enabled = true;

        let data = await user.toJSON("firstName,age");
        expect(data).toContainAllKeys(["id", "firstName", "age"]);
        expect(data.firstName).toEqual("John");
        expect(data.age).toEqual(12);

        data = await user.toJSON();
        expect(data).toEqual({ id: null });
    });

    test("should return empty object", async () => {
        const user = new User();

        user.firstName = "John";
        user.lastName = "Doe";
        user.age = 12;
        user.enabled = true;

        const data = await user.toJSON("firstName,age");
        expect(data).toContainAllKeys(["id", "firstName", "age"]);
        expect(data.firstName).toEqual("John");
        expect(data.age).toEqual(12);
    });

    test("should not return whole entities, just attributes", async () => {
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
        expect(data).toEqual({ id: 10 });

        data = await mainEntity.toJSON("attribute1,attribute2");
        expect(data).toEqual({
            id: 10,
            attribute1: [{ id: "AA" }, { id: 12 }],
            attribute2: [{ id: 13 }]
        });

        data = await mainEntity.toJSON(
            "attribute1.id,attribute1.name,attribute2[id,firstName,lastName,name]"
        );

        expect(data).toEqual({
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

    test("must always return 'id' field, no matter if it was specified or not", async () => {
        const [entity1, entity2, entity3] = [
            new User().populate({ id: "A", age: 30 }),
            new User().populate({ id: null, age: 35 }),
            new User().populate({ id: null, age: null })
        ];

        expect(await entity1.toJSON("id,age")).toEqual({ id: "A", age: 30 });
        expect(await entity1.toJSON("age")).toEqual({ id: "A", age: 30 });
        expect(await entity1.toJSON("id")).toEqual({ id: "A" });
        expect(await entity1.toJSON()).toEqual({ id: "A" });

        expect(await entity2.toJSON("id,age")).toEqual({ id: null, age: 35 });
        expect(await entity2.toJSON("age")).toEqual({ id: null, age: 35 });
        expect(await entity2.toJSON("id")).toEqual({ id: null });
        expect(await entity2.toJSON()).toEqual({ id: null });

        expect(await entity3.toJSON("id,age")).toEqual({ id: null, age: null });
        expect(await entity3.toJSON("age")).toEqual({ id: null, age: null });
        expect(await entity3.toJSON("id")).toEqual({ id: null });
        expect(await entity3.toJSON()).toEqual({ id: null });
    });

    test("should not return fields that does not exist", async () => {
        const user = new User().populate({ id: "A", age: 30 });
        const extract = await user.toJSON("age,username");
        expect(extract).toEqual({ id: "A", age: 30 });
    });

    test("should pass arguments correctly", async () => {
        const user = new User();
        expect(await user.getAttribute("dynamicWithArgs").getJSONValue(1, 2, 3)).toEqual(6);
        expect(await user.get("dynamicWithArgs:1:2:3")).toEqual("123");
        expect(await user.toJSON("dynamicWithArgs:1:2:3")).toEqual({
            id: null,
            dynamicWithArgs: "123"
        });
    });
});
