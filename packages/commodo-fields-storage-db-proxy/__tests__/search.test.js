import sinon from "sinon";
import SimpleModel from "./models/simpleModel";
import { database, collection, findCursor } from "./database";

const sandbox = sinon.createSandbox();

describe("search test", function() {
    afterEach(() => sandbox.restore());
    beforeEach(() => SimpleModel.getStoragePool().flush());

    it("should search models with $or operator", async () => {
        const collectionSpy = sandbox.spy(database, "collection");
        const findSpy = sandbox.spy(collection, "find");
        const limitSpy = sandbox.spy(findCursor, "limit");
        const skipSpy = sandbox.spy(findCursor, "skip");

        await SimpleModel.find({
            search: {
                query: "this is",
                fields: ["name", "slug"]
            }
        });

        expect(limitSpy.getCall(0).args[0]).toBe(10);
        expect(skipSpy.getCall(0).args[0]).toBe(0);
        expect(collectionSpy.getCall(0).args[0]).toBe("SimpleModel");
        expect(findSpy.getCall(0).args[0]).toEqual({
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

    it("should search models with $and operator", async () => {
        const collectionSpy = sandbox.spy(database, "collection");
        const findSpy = sandbox.spy(collection, "find");
        const limitSpy = sandbox.spy(findCursor, "limit");
        const skipSpy = sandbox.spy(findCursor, "skip");

        await SimpleModel.find({
            search: {
                query: "this is",
                fields: ["name", "slug"],
                operator: "and"
            }
        });

        expect(limitSpy.getCall(0).args[0]).toBe(10);
        expect(skipSpy.getCall(0).args[0]).toBe(0);
        expect(collectionSpy.getCall(0).args[0]).toBe("SimpleModel");
        expect(findSpy.getCall(0).args[0]).toEqual({
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

    it("should search models over only one column", async () => {
        const collectionSpy = sandbox.spy(database, "collection");
        const findSpy = sandbox.spy(collection, "find");
        const limitSpy = sandbox.spy(findCursor, "limit");
        const skipSpy = sandbox.spy(findCursor, "skip");

        await SimpleModel.find({
            search: {
                query: "this is",
                fields: ["name"]
            }
        });

        expect(limitSpy.getCall(0).args[0]).toBe(10);
        expect(skipSpy.getCall(0).args[0]).toBe(0);
        expect(collectionSpy.getCall(0).args[0]).toBe("SimpleModel");
        expect(findSpy.getCall(0).args[0]).toEqual({
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

        await SimpleModel.find({
            search: {
                query: "this is",
                fields: ["name", "slug"]
            },
            query: {
                age: { $gt: 30 },
                country: "HR"
            }
        });

        expect(limitSpy.getCall(0).args[0]).toBe(10);
        expect(skipSpy.getCall(0).args[0]).toBe(0);
        expect(collectionSpy.getCall(0).args[0]).toBe("SimpleModel");
        expect(findSpy.getCall(0).args[0]).toEqual({
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

        await SimpleModel.find({
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

        expect(limitSpy.getCall(0).args[0]).toBe(7);
        expect(skipSpy.getCall(0).args[0]).toBe(14);
        expect(collectionSpy.getCall(0).args[0]).toBe("SimpleModel");
        expect(sortSpy.getCall(0).args[0]).toEqual({ createdOn: -1, id: 1 });
        expect(findSpy.getCall(0).args[0]).toEqual({
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
