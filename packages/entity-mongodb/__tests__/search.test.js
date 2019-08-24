import { assert } from "chai";

import sinon from "sinon";
import SimpleEntity from "./entities/simpleEntity";
import { database, collection, findCursor } from "./database";

const sandbox = sinon.sandbox.create();

describe("search test", function() {
    afterEach(() => sandbox.restore());
    beforeEach(() => SimpleEntity.getEntityPool().flush());

    it("should search entities with OR operator", async () => {
        const collectionSpy = sandbox.spy(database, "collection");
        const findSpy = sandbox.spy(collection, "find");
        const limitSpy = sandbox.spy(findCursor, "limit");
        const skipSpy = sandbox.spy(findCursor, "skip");

        await SimpleEntity.find({
            search: {
                query: "this is",
                fields: ["name", "slug"]
            }
        });

        assert.equal(limitSpy.getCall(0).args[0], 10);
        assert.equal(skipSpy.getCall(0).args[0], 0);
        assert.equal(collectionSpy.getCall(0).args[0], "SimpleEntity");
        assert.deepEqual(findSpy.getCall(0).args[0], {
            $or: [
                {
                    name: {
                        $regex: ".*this is.*",
                        $options: "i"
                    }
                },
                {
                    slug: {
                        $regex: ".*this is.*",
                        $options: "i"
                    }
                }
            ]
        });

        collectionSpy.restore();
        findSpy.restore();
    });

    it("should search entities with AND operator", async () => {
        const collectionSpy = sandbox.spy(database, "collection");
        const findSpy = sandbox.spy(collection, "find");
        const limitSpy = sandbox.spy(findCursor, "limit");
        const skipSpy = sandbox.spy(findCursor, "skip");

        await SimpleEntity.find({
            search: {
                query: "this is",
                fields: ["name", "slug"],
                operator: "and"
            }
        });

        assert.equal(limitSpy.getCall(0).args[0], 10);
        assert.equal(skipSpy.getCall(0).args[0], 0);
        assert.equal(collectionSpy.getCall(0).args[0], "SimpleEntity");
        assert.deepEqual(findSpy.getCall(0).args[0], {
            $and: [
                {
                    name: {
                        $regex: ".*this is.*",
                        $options: "i"
                    }
                },
                {
                    slug: {
                        $regex: ".*this is.*",
                        $options: "i"
                    }
                }
            ]
        });

        collectionSpy.restore();
        findSpy.restore();
    });

    it("should search entities over only one column", async () => {
        const collectionSpy = sandbox.spy(database, "collection");
        const findSpy = sandbox.spy(collection, "find");
        const limitSpy = sandbox.spy(findCursor, "limit");
        const skipSpy = sandbox.spy(findCursor, "skip");

        await SimpleEntity.find({
            search: {
                query: "this is",
                fields: ["name"]
            }
        });

        assert.equal(limitSpy.getCall(0).args[0], 10);
        assert.equal(skipSpy.getCall(0).args[0], 0);
        assert.equal(collectionSpy.getCall(0).args[0], "SimpleEntity");
        assert.deepEqual(findSpy.getCall(0).args[0], {
            $or: [
                {
                    name: {
                        $regex: ".*this is.*",
                        $options: "i"
                    }
                }
            ]
        });

        collectionSpy.restore();
        findSpy.restore();
    });

    it("should use search and combine it with other sent query parameters", async () => {
        const collectionSpy = sandbox.spy(database, "collection");
        const findSpy = sandbox.spy(collection, "find");
        const limitSpy = sandbox.spy(findCursor, "limit");
        const skipSpy = sandbox.spy(findCursor, "skip");

        await SimpleEntity.find({
            search: {
                query: "this is",
                fields: ["name", "slug"]
            },
            query: {
                age: { $gt: 30 },
                country: "HR"
            }
        });

        assert.equal(limitSpy.getCall(0).args[0], 10);
        assert.equal(skipSpy.getCall(0).args[0], 0);
        assert.equal(collectionSpy.getCall(0).args[0], "SimpleEntity");
        assert.deepEqual(findSpy.getCall(0).args[0], {
            $and: [
                {
                    $or: [
                        {
                            name: {
                                $regex: ".*this is.*",
                                $options: "i"
                            }
                        },
                        {
                            slug: {
                                $regex: ".*this is.*",
                                $options: "i"
                            }
                        }
                    ]
                },
                {
                    age: { $gt: 30 },
                    country: "HR"
                }
            ]
        });

        collectionSpy.restore();
        findSpy.restore();
    });

    it("must apply search, and also take into consideration other arguments like page, perPage, and order", async () => {
        const collectionSpy = sandbox.spy(database, "collection");
        const findSpy = sandbox.spy(collection, "find");
        const limitSpy = sandbox.spy(findCursor, "limit");
        const skipSpy = sandbox.spy(findCursor, "skip");
        const sortSpy = sandbox.spy(findCursor, "sort");

        await SimpleEntity.find({
            page: 3,
            perPage: 7,
            query: { age: { $lte: 30 } },
            sort: { createdOn: -1, id: 1 },
            search: {
                query: "this is",
                fields: ["name", "slug"],
                operator: "or"
            }
        });


        assert.equal(limitSpy.getCall(0).args[0], 7);
        assert.equal(skipSpy.getCall(0).args[0], 14);
        assert.equal(collectionSpy.getCall(0).args[0], "SimpleEntity");
        assert.deepEqual(sortSpy.getCall(0).args[0], { createdOn: -1, id: 1 });
        assert.deepEqual(findSpy.getCall(0).args[0], {
            $and: [
                {
                    $or: [
                        {
                            name: {
                                $regex: ".*this is.*",
                                $options: "i"
                            }
                        },
                        {
                            slug: {
                                $regex: ".*this is.*",
                                $options: "i"
                            }
                        }
                    ]
                },
                {
                    age: {
                        $lte: 30
                    }
                }
            ]
        });

        collectionSpy.restore();
        findSpy.restore();
    });
});
