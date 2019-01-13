import { assert } from "chai";

import sinon from "sinon";
import SimpleEntity from "./entities/simpleEntity";
import { collection, findCursor, database } from "./database";

const sandbox = sinon.sandbox.create();

describe("find test", function() {
    afterEach(() => sandbox.restore());
    beforeEach(() => SimpleEntity.getEntityPool().flush());

    it("find - must generate simple query correctly", async () => {
        const collectionSpy = sandbox.spy(database, "collection");
        const findSpy = sandbox.spy(collection, "find");
        const limitSpy = sandbox.spy(findCursor, "limit");
        const skipSpy = sandbox.spy(findCursor, "skip");

        await SimpleEntity.find();

        assert.equal(limitSpy.getCall(0).args[0], 10);
        assert.equal(skipSpy.getCall(0).args[0], 0);
        assert.equal(collectionSpy.getCall(0).args[0], "SimpleEntity");
        assert.isUndefined(findSpy.getCall(0).args[0]);
    });

    it("should find entities and total count", async () => {
        findCursor.data = [
            {
                id: 1,
                name: "This is a test",
                slug: "thisIsATest",
                enabled: true
            },
            {
                id: 2,
                name: "This is a test 222",
                slug: "thisIsATest222",
                enabled: false
            }
        ];

        const entities = await SimpleEntity.find();

        assert.isArray(entities);
        assert.lengthOf(entities, 2);

        assert.equal(entities[0].id, 1);
        assert.equal(entities[0].name, "This is a test");
        assert.equal(entities[0].slug, "thisIsATest");
        assert.isTrue(entities[0].enabled);

        assert.equal(entities[1].id, 2);
        assert.equal(entities[1].name, "This is a test 222");
        assert.equal(entities[1].slug, "thisIsATest222");
        assert.isFalse(entities[1].enabled);
    });

    it("must change page and perPage parameters into limit / offset accordingly", async () => {

        const collectionSpy = sandbox.spy(database, "collection");
        const findSpy = sandbox.spy(collection, "find");
        const limitSpy = sandbox.spy(findCursor, "limit");
        const skipSpy = sandbox.spy(findCursor, "skip");
        const sortSpy = sandbox.spy(findCursor, "sort");

        await SimpleEntity.find({
            page: 3,
            perPage: 7,
            query: { age: 30 },
            sort: { createdOn: -1, id: 1 }
        });

        assert.equal(limitSpy.getCall(0).args[0], 7);
        assert.equal(skipSpy.getCall(0).args[0], 14);
        assert.deepEqual(sortSpy.getCall(0).args[0], { createdOn: -1, id: 1 });
        assert.equal(collectionSpy.getCall(0).args[0], "SimpleEntity");
        assert.deepEqual(findSpy.getCall(0).args[0], {age: 30});
    });
});
