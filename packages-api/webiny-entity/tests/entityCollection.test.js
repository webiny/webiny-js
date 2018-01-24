import { assert, expect } from "chai";
import User from "./entities/user";
import { EntityCollection } from "./..";

const getEntities = () => [
    new User().populate({ age: 30 }),
    new User().populate({ age: 35 }),
    new User().populate({ age: 40 })
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
});
