import { expect } from "chai";
import User from "./entities/user";
import { EntityCollection } from "./..";
import EntityCollectionError from "../src/entityCollectionError";

const getEntities = () => [
    new User().populate({ id: "A", age: 30 }),
    new User().populate({ id: "B", age: 35 }),
    new User().populate({ id: "C", age: 40 })
];

describe("EntityCollection test", function() {
    it("must correctly accept an array of entities", async () => {
        const entities = getEntities();
        const collection = new EntityCollection(entities);
        expect(collection).to.have.lengthOf(3);
        expect(collection[0].age).to.equal(30);
        expect(collection[1].age).to.equal(35);
        expect(collection[2].age).to.equal(40);
    });

    it("must correctly push new entities", async () => {
        const entities = getEntities();
        const collection = new EntityCollection(entities);

        collection.push(new User().populate({ age: 45 }));
        expect(collection).to.have.lengthOf(4);
        expect(collection[3].age).to.equal(45);

        expect(() => collection.push(1)).to.throw(Error);
        expect(() => collection.push({ age: 50 })).to.throw(Error);

        expect(collection).to.have.lengthOf(4);
        expect(collection[3].age).to.equal(45);
    });

    it("must throw an error on construct, if one of the values is not an instance of Entity", async () => {
        expect(() => {
            new EntityCollection([new User(), new User(), { id: 123 }]);
        }).to.throw(Error);
    });

    it("setParams/getParams methods must work correctly", async () => {
        const collection = new EntityCollection();
        collection.setParams({ a: 123 });
        expect(collection.getParams().a).to.equal(123);
    });

    it("setCount/getCount methods must work correctly", async () => {
        const collection = new EntityCollection();
        collection.setCount(444);
        expect(collection.getCount()).to.equal(444);
    });

    it("setMeta/getMeta methods must work correctly", async () => {
        const collection = new EntityCollection();
        collection.setMeta({ a: 123 });
        expect(collection.getMeta().a).to.equal(123);
    });

    it("toJSON must not throw an error if fields are not specified", async () => {
        const collection = new EntityCollection();
        await collection.toJSON();
    });

    it("toJSON must return array consisting of JSON representations of each entity", async () => {
        const collection = new EntityCollection(getEntities());

        const json = await collection.toJSON("firstName,age");

        expect(json).to.deep.equal([
            { id: "A", firstName: null, age: 30 },
            { id: "B", firstName: null, age: 35 },
            { id: "C", firstName: null, age: 40 }
        ]);
    });

    it("toJSON must always include ID, no matter if it was specified or not", async () => {
        const collection = new EntityCollection(getEntities());

        const json = await collection.toJSON("firstName,age");

        expect(json).to.deep.equal([
            { id: "A", firstName: null, age: 30 },
            { id: "B", firstName: null, age: 35 },
            { id: "C", firstName: null, age: 40 }
        ]);
    });
});
