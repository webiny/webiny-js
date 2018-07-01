import User from "./entities/user";
import { EntityCollection } from "webiny-entity";

const getEntities = () => [
    new User().populate({ id: "A", age: 30 }),
    new User().populate({ id: "B", age: 35 }),
    new User().populate({ id: "C", age: 40 })
];

describe("EntityCollection test", () => {
    test("must correctly accept an array of entities", async () => {
        const entities = getEntities();
        const collection = new EntityCollection(entities);
        expect(collection).toHaveLength(3);
        expect(collection[0].age).toEqual(30);
        expect(collection[1].age).toEqual(35);
        expect(collection[2].age).toEqual(40);
    });

    test("must correctly push new entities and all other values without throwing errors", async () => {
        const entities = getEntities();
        const collection = new EntityCollection(entities);

        collection.push(new User().populate({ age: 45 }));
        expect(collection).toHaveLength(4);
        expect(collection[3].age).toEqual(45);
        collection.push(1);
        collection.push({ age: 50 });

        expect(collection).toHaveLength(6);
        expect(collection[3].age).toEqual(45);
    });

    test("must NOT throw an error on construct, if one of the values is not an instance of Entity", async () => {
        new EntityCollection([new User(), new User(), { id: 123 }]);
    });

    test("setParams/getParams methods must work correctly", async () => {
        const collection = new EntityCollection();
        collection.setParams({ a: 123 });
        expect(collection.getParams().a).toEqual(123);
    });

    test("setTotalCount/getTotalCount methods must work correctly", async () => {
        const collection = new EntityCollection();
        collection.setTotalCount(444);
        expect(collection.getTotalCount()).toEqual(444);
    });

    test("setMeta/getMeta methods must work correctly", async () => {
        const collection = new EntityCollection();
        collection.setMeta({ a: 123 });
        expect(collection.getMeta().a).toEqual(123);
    });

    test("toJSON must not throw an error if fields are not specified", async () => {
        const collection = new EntityCollection();
        await collection.toJSON();
    });

    test("toJSON must return array consisting of JSON representations of each entity", async () => {
        const collection = new EntityCollection(getEntities());

        const json = await collection.toJSON("firstName,age");

        expect(json).toEqual([
            { id: "A", firstName: null, age: 30 },
            { id: "B", firstName: null, age: 35 },
            { id: "C", firstName: null, age: 40 }
        ]);
    });

    test("toJSON must always include ID, no matter if it was specified or not", async () => {
        const collection = new EntityCollection(getEntities());

        const json = await collection.toJSON("firstName,age");

        expect(json).toEqual([
            { id: "A", firstName: null, age: 30 },
            { id: "B", firstName: null, age: 35 },
            { id: "C", firstName: null, age: 40 }
        ]);
    });
});
