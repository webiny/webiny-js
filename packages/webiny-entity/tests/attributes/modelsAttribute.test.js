import { assert } from "chai";
import { User } from "./../entities/modelAttributeEntities";
import sinon from "sinon";
import { QueryResult } from "../..";

const sandbox = sinon.sandbox.create();

describe("custom attribute test", function() {
    afterEach(() => sandbox.restore());
    beforeEach(() => User.getEntityPool().flush());

    it("should load entities from database", async () => {
        let entityFind = sandbox.stub(User.getDriver(), "findOne").callsFake(() => {
            return new QueryResult({
                id: "xyz",
                verifications: [
                    {
                        updatedOn: null,
                        document: "ghi",
                        status: "pending"
                    },
                    {
                        updatedOn: new Date(),
                        document: "def",
                        status: "declined"
                    },
                    {
                        updatedOn: new Date(),
                        document: "abc",
                        status: "declined"
                    }
                ]
            });
        });

        const user = await User.findById("xyz");
        entityFind.restore();

        assert.equal(user.id, "xyz");

        let verification = await user.get("verifications.0");
        assert.equal(verification.updatedOn, null);
        assert.equal(verification.status, "pending");

        entityFind = sandbox.stub(User.getDriver(), "findOne").callsFake(() => {
            return new QueryResult({ id: "ghi", file: "verification.pdf", size: 10, type: "jpg" });
        });

        let document = await verification.document;
        entityFind.restore();

        assert.equal(document.id, "ghi");
        assert.equal(document.file, "verification.pdf");
        assert.equal(document.size, 10);
        assert.equal(document.type, "jpg");

        verification = await user.get("verifications.1");
        assert.instanceOf(verification.updatedOn, Date);
        assert.equal(verification.status, "declined");

        entityFind = sandbox.stub(User.getDriver(), "findOne").callsFake(() => {
            return new QueryResult({
                id: "123",
                file: "verification123.pdf",
                size: 100,
                type: "jpg"
            });
        });

        document = await verification.document;
        entityFind.restore();

        assert.equal(document.id, "123");
        assert.equal(document.file, "verification123.pdf");
        assert.equal(document.size, 100);
        assert.equal(document.type, "jpg");

        assert.lengthOf(user.verifications, 3);
    });

    it("should return correct storage value", async () => {
        let entityFind = sandbox.stub(User.getDriver(), "findOne").callsFake(() => {
            return new QueryResult({
                id: "xyz"
            });
        });

        const user = new User();
        user.populate({
            verifications: [
                {
                    updatedOn: null,
                    document: "ghi",
                    status: "pending"
                },
                {
                    updatedOn: new Date(),
                    document: "def",
                    status: "declined"
                },
                {
                    updatedOn: new Date(),
                    document: "abc",
                    status: "declined"
                }
            ]
        });

        entityFind.restore();

        let storage = await user.toStorage();
        assert.equal(storage.firstName, null);
        assert.equal(storage.verification, null);

        let verification1 = storage.verifications[0];
        assert.equal(verification1.status, "pending");
        assert.equal(verification1.updatedOn, null);
        assert.equal(verification1.document, "ghi");

        let verification2 = storage.verifications[1];
        assert.equal(verification2.status, "declined");
        assert.instanceOf(verification2.updatedOn, Date);
        assert.equal(verification2.document, "def");

        let verification3 = storage.verifications[2];
        assert.equal(verification3.status, "declined");
        assert.instanceOf(verification3.updatedOn, Date);
        assert.equal(verification3.document, "abc");

        entityFind = sandbox
            .stub(User.getDriver(), "findOne")
            .onCall(0)
            .callsFake(() => {
                return new QueryResult({
                    id: "ghi",
                    file: "verification123.pdf",
                    size: 100,
                    type: "jpg"
                });
            })
            .onCall(1)
            .callsFake(() => {
                return new QueryResult({
                    id: "def",
                    file: "verification123.pdf",
                    size: 100,
                    type: "jpg"
                });
            })
            .onCall(2)
            .callsFake(() => {
                return new QueryResult({
                    id: "abc",
                    file: "verification123.pdf",
                    size: 100,
                    type: "jpg"
                });
            });

        user.verifications[0].document;
        user.verifications[1].document;
        user.verifications[2].document;

        storage = await user.toStorage();

        entityFind.restore();

        assert.equal(storage.firstName, null);
        assert.equal(storage.verification, null);

        verification1 = storage.verifications[0];
        assert.equal(verification1.status, "pending");
        assert.equal(verification1.updatedOn, null);
        assert.equal(verification1.document, "ghi");

        verification2 = storage.verifications[1];
        assert.equal(verification2.status, "declined");
        assert.instanceOf(verification2.updatedOn, Date);
        assert.equal(verification2.document, "def");

        verification3 = storage.verifications[2];
        assert.equal(verification3.status, "declined");
        assert.instanceOf(verification3.updatedOn, Date);
        assert.equal(verification3.document, "abc");
    });
});
