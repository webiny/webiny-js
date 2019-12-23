import sinon from "sinon";
import SimpleModel from "./models/simpleModel";
import { collection, findCursor, database } from "./database";

const sandbox = sinon.createSandbox();

describe("find test", function() {
    afterEach(() => sandbox.restore());
    beforeEach(() => SimpleModel.getStoragePool().flush());

    it("find - must generate simple query correctly", async () => {
        const collectionSpy = sandbox.spy(database, "collection");
        const findSpy = sandbox.spy(collection, "find");
        const limitSpy = sandbox.spy(findCursor, "limit");
        const skipSpy = sandbox.spy(findCursor, "skip");

        await SimpleModel.find();

        expect(limitSpy.getCall(0).args[0]).toBe(10);
        expect(skipSpy.getCall(0).args[0]).toBe(0);
        expect(collectionSpy.getCall(0).args[0]).toBe("SimpleModel");
        expect(findSpy.getCall(0).args[0]).toBe(undefined);
    });

    it("should find models and total count", async () => {
        findCursor.data = [
            {
                id: "aaa",
                name: "This is a test",
                slug: "thisIsATest",
                enabled: true
            },
            {
                id: "bbb",
                name: "This is a test 222",
                slug: "thisIsATest222",
                enabled: false
            }
        ];

        const models = await SimpleModel.find();

        expect(Array.isArray(models)).toBe(true);
        expect(models.length).toBe(2);

        expect(models[0].id).toEqual("aaa");
        expect(models[0].name).toEqual("This is a test");
        expect(models[0].slug).toEqual("thisIsATest");
        expect(models[0].enabled).toBe(true);

        expect(models[1].id).toEqual("bbb");
        expect(models[1].name).toEqual("This is a test 222");
        expect(models[1].slug).toEqual("thisIsATest222");
        expect(models[1].enabled).toBe(false);
    });

    it("must change page and perPage parameters into limit / offset accordingly", async () => {
        const collectionSpy = sandbox.spy(database, "collection");
        const findSpy = sandbox.spy(collection, "find");
        const limitSpy = sandbox.spy(findCursor, "limit");
        const skipSpy = sandbox.spy(findCursor, "skip");
        const sortSpy = sandbox.spy(findCursor, "sort");

        sandbox
            .stub(collection, "countDocuments")
            .onCall(0)
            .callsFake(() => {
                return 20;
            });

        const results = await SimpleModel.find({
            page: 3,
            perPage: 7,
            query: { age: 30 },
            sort: { createdOn: -1, id: 1 }
        });

        expect(results.getMeta()).toEqual({
            page: 3,
            perPage: 7,
            totalCount: 20,
            totalPages: 3,
            from: 15,
            to: 20,
            nextPage: null,
            previousPage: 2
        });

        expect(limitSpy.getCall(0).args[0]).toEqual(7);
        expect(skipSpy.getCall(0).args[0]).toEqual(14);
        expect(sortSpy.getCall(0).args[0]).toEqual({ createdOn: -1, id: 1 });
        expect(collectionSpy.getCall(0).args[0]).toEqual("SimpleModel");
        expect(findSpy.getCall(0).args[0]).toEqual({ age: 30 });
    });

    it("find - must NOT calculate meta if it was set to false via options", async () => {
        const countDocumentSpy = sandbox.spy(collection, "countDocuments");

        await SimpleModel.find({});
        await SimpleModel.find({});
        await SimpleModel.find({});
        await SimpleModel.find({});
        await SimpleModel.find({ meta: false });
        await SimpleModel.find({ meta: false });
        await SimpleModel.find({ meta: false });
        await SimpleModel.find({ meta: false });
        await SimpleModel.find({});
        await SimpleModel.find({});

        expect(countDocumentSpy.callCount).toBe(6);
    });
});
