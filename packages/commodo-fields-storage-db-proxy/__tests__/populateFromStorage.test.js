import sinon from "sinon";
import { ComplexModel, SimpleModel } from "./models/complexModel";
import { collection, findCursor } from "./database";
import mdbid from "mdbid";

const sandbox = sinon.createSandbox();

describe("populateFromStorage test", function() {
    afterEach(() => {
        sandbox.restore();
        findCursor.data = [];
    });
    beforeEach(() => ComplexModel.getStoragePool().flush());

    it("should populate model correctly with data received from MongoDb", async () => {
        const twoTwo = mdbid();
        const threeThree = mdbid();
        const fourFour = mdbid();

        let findOneStub = sandbox.stub(collection, "find").callsFake(() => {
            findCursor.data = [
                {
                    firstName: "test",
                    lastName: "tester",
                    verification: { verified: true, documentType: "driversLicense" },
                    tags: [
                        { slug: "no-name", label: "No Name" },
                        { slug: "adult-user", label: "Adult User" }
                    ],
                    simpleModel: "01234567890123456789adee",
                    simpleModels: [twoTwo, threeThree, fourFour]
                }
            ];
            return findCursor;
        });

        let user = new ComplexModel();
        expect(user.getField("simpleModel").state.loading).toBe(false);
        expect(user.getField("simpleModel").state.loaded).toBe(false);

        const one = mdbid();
        user = await ComplexModel.findById(one);
        expect(user.getField("simpleModel").state.loading).toBe(false);
        expect(user.getField("simpleModel").state.loaded).toBe(false);

        findOneStub.restore();

        expect(user.firstName).toBe("test");
        expect(user.lastName).toBe("tester");
        expect(user.verification.verified).toBe(true);
        expect(user.verification.documentType).toBe("driversLicense");
        expect(user.tags[0].slug).toBe("no-name");
        expect(user.tags[0].label).toBe("No Name");
        expect(user.tags[1].slug).toBe("adult-user");
        expect(user.tags[1].label).toBe("Adult User");
        expect(user.tags.length).toBe(2);

        expect(user.getField("simpleModel").current).toBe("01234567890123456789adee");

        findOneStub = sandbox.stub(collection, "find").callsFake(() => {
            findCursor.data = [{ id: "01234567890123456789adee", name: "Test-1" }];
            return findCursor;
        });

        const simpleModel = await user.simpleModel;
        findOneStub.restore();

        expect(simpleModel.id).toBe("01234567890123456789adee");
        expect(simpleModel.name).toBe("Test-1");

        const two = mdbid();
        const three = mdbid();
        const four = mdbid();
        findCursor.data = [
            { id: two, name: "Test-2" },
            { id: three, name: "Test-3" },
            { id: four, name: "Test-4" }
        ];

        const countStub = sandbox.stub(collection, "countDocuments").callsFake(() => 3);

        expect((await user.simpleModels).length).toBe(3);

        const simpleModels = await user.simpleModels;
        expect(simpleModels[0] instanceof SimpleModel).toBe(true);
        expect(simpleModels[0].id).toBe(two);
        expect(simpleModels[0].name).toBe("Test-2");

        expect(simpleModels[1] instanceof SimpleModel).toBe(true);
        expect(simpleModels[1].id).toBe(three);
        expect(simpleModels[1].name).toBe("Test-3");

        expect(simpleModels[2] instanceof SimpleModel).toBe(true);
        expect(simpleModels[2].id).toBe(four);
        expect(simpleModels[2].name).toBe("Test-4");

        countStub.restore();
        findCursor.data = [];
    });
});
