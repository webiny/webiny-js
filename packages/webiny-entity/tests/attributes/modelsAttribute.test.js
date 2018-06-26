import { User } from "./../entities/modelAttributeEntities";
import sinon from "sinon";
import { QueryResult } from "../../src";

const sandbox = sinon.sandbox.create();

describe("custom attribute test", () => {
    afterEach(() => sandbox.restore());
    beforeEach(() => User.getEntityPool().flush());

    test("should load entities from database", async () => {
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

        expect(user.id).toEqual("xyz");

        let verification = await user.get("verifications.0");
        expect(verification.updatedOn).toBeNil();
        expect(verification.status).toEqual("pending");

        entityFind = sandbox.stub(User.getDriver(), "findOne").callsFake(() => {
            return new QueryResult({ id: "ghi", file: "verification.pdf", size: 10, type: "jpg" });
        });

        let document = await verification.document;
        entityFind.restore();

        expect(document.id).toEqual("ghi");
        expect(document.file).toEqual("verification.pdf");
        expect(document.size).toEqual(10);
        expect(document.type).toEqual("jpg");

        verification = await user.get("verifications.1");
        expect(verification.updatedOn).toBeInstanceOf(Date);
        expect(verification.status).toEqual("declined");

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

        expect(document.id).toEqual("123");
        expect(document.file).toEqual("verification123.pdf");
        expect(document.size).toEqual(100);
        expect(document.type).toEqual("jpg");

        expect(user.verifications.length).toBe(3);
    });

    test("should return correct storage value", async () => {
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
        expect(storage.firstName).toBeNil();
        expect(storage.verification).toBeNil();

        let verification1 = storage.verifications[0];
        expect(verification1.status).toEqual("pending");
        expect(verification1.updatedOn).toBeNil();
        expect(verification1.document).toEqual("ghi");

        let verification2 = storage.verifications[1];
        expect(verification2.status).toEqual("declined");
        expect(verification2.updatedOn).toBeInstanceOf(Date);
        expect(verification2.document).toEqual("def");

        let verification3 = storage.verifications[2];
        expect(verification3.status).toEqual("declined");
        expect(verification3.updatedOn).toBeInstanceOf(Date);
        expect(verification3.document).toEqual("abc");

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

        expect(storage.firstName).toBeNil();
        expect(storage.verification).toBeNil();

        verification1 = storage.verifications[0];
        expect(verification1.status).toEqual("pending");
        expect(verification1.updatedOn).toBeNil();
        expect(verification1.document).toEqual("ghi");

        verification2 = storage.verifications[1];
        expect(verification2.status).toEqual("declined");
        expect(verification2.updatedOn).toBeInstanceOf(Date);
        expect(verification2.document).toEqual("def");

        verification3 = storage.verifications[2];
        expect(verification3.status).toEqual("declined");
        expect(verification3.updatedOn).toBeInstanceOf(Date);
        expect(verification3.document).toEqual("abc");
    });
});
