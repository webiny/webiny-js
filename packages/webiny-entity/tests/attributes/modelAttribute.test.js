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
                verification: {
                    updatedOn: null,
                    document: "abc",
                    status: "pending"
                }
            });
        });

        const issue = await User.findById("xyz");
        entityFind.restore();

        expect(issue.id).toEqual("xyz");

        entityFind = sandbox.stub(User.getDriver(), "findOne").callsFake(() => {
            return new QueryResult({ id: "abc", file: "verification.pdf", size: 10, type: "jpg" });
        });

        expect(await issue.get("verification.updatedOn")).toEqual(null);
        expect(await issue.get("verification.status")).toEqual("pending");

        const document = await issue.get("verification.document");
        expect(document.id).toEqual("abc");
        expect(document.file).toEqual("verification.pdf");
        expect(document.size).toEqual(10);
        expect(document.type).toEqual("jpg");

        entityFind.restore();
    });

    test("should return correct storage value", async () => {
        let entityFind = sandbox.stub(User.getDriver(), "findOne").callsFake(() => {
            return new QueryResult({
                id: "xyz",
                verification: {
                    updatedOn: null,
                    document: "abc",
                    status: "pending"
                }
            });
        });

        const user = await User.findById("xyz");
        entityFind.restore();

        let storage = await user.toStorage();
        expect(storage).toEqual({});

        entityFind = sandbox.stub(User.getDriver(), "findOne").callsFake(() => {
            return new QueryResult({ id: "abc", file: "verification.pdf", size: 10, type: "jpg" });
        });

        await user.get("verification.document");
        entityFind.restore();

        storage = await user.toStorage();
        expect(storage).toEqual({});

        user.verification = {
            status: "pending",
            updatedOn: null,
            document: "abc"
        };
        storage = await user.toStorage();
        expect(storage).toEqual({
            verification: {
                document: "abc",
                status: "pending",
                updatedOn: null
            }
        });
    });
});
