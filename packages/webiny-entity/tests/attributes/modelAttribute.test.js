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
                verification: {
                    updatedOn: null,
                    document: "abc",
                    status: "pending"
                }
            });
        });

        const issue = await User.findById("xyz");
        entityFind.restore();

        assert.equal(issue.id, "xyz");

        entityFind = sandbox.stub(User.getDriver(), "findOne").callsFake(() => {
            return new QueryResult({ id: "abc", file: "verification.pdf", size: 10, type: "jpg" });
        });

        assert.equal(await issue.get("verification.updatedOn"), null);
        assert.equal(await issue.get("verification.status"), "pending");

        const document = await issue.get("verification.document");
        assert.equal(document.id, "abc");
        assert.equal(document.file, "verification.pdf");
        assert.equal(document.size, 10);
        assert.equal(document.type, "jpg");

        entityFind.restore();
    });

    it("should return correct storage value", async () => {
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
        assert.deepEqual(storage, {});

        entityFind = sandbox.stub(User.getDriver(), "findOne").callsFake(() => {
            return new QueryResult({ id: "abc", file: "verification.pdf", size: 10, type: "jpg" });
        });

        await user.get("verification.document");
        entityFind.restore();

        storage = await user.toStorage();
        assert.deepEqual(storage, {});

        user.verification = {
            status: "pending",
            updatedOn: null,
            document: "abc"
        };
        storage = await user.toStorage();
        assert.deepEqual(storage, {
            verification: {
                document: "abc",
                status: "pending",
                updatedOn: null
            }
        });
    });
});
