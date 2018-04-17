import { assert } from "chai";
import { Issue, User, Company } from "./../entities/customAttributeEntities";
import sinon from "sinon";
import { QueryResult } from "../..";

const sandbox = sinon.sandbox.create();

describe("custom attribute test", function() {
    afterEach(() => sandbox.restore());
    beforeEach(() => User.getEntityPool().flush());

    it("should be able to work with a custom attribute", async () => {
        const user = new User();
        user.populate({ firstName: "John", lastName: "Doe" });

        const issue1 = new Issue();
        issue1.populate({ title: "testing custom attribute", assignedTo: user });

        const json1 = await issue1.toJSON("title,assignedTo[firstName,lastName]");
        assert.deepEqual(json1, {
            id: null,
            assignedTo: {
                firstName: "John",
                lastName: "Doe"
            },
            title: "testing custom attribute"
        });

        const company = new Company();
        company.populate({ name: "Webiny" });

        const issue2 = new Issue();
        issue2.populate({ title: "testing custom attribute", assignedTo: company });

        const json2 = await issue2.toJSON("title,assignedTo[name]");
        assert.deepEqual(json2, {
            id: null,
            assignedTo: {
                name: "Webiny"
            },
            title: "testing custom attribute"
        });
    });

    it("should load entities from database", async () => {
        let entityFind = sandbox.stub(User.getDriver(), "findOne").callsFake(() => {
            return new QueryResult({ id: "xyz", assignedTo: "abc", assignedToClassId: "User" });
        });

        const issue = await Issue.findById(1);
        entityFind.restore();

        assert.equal(issue.id, "xyz");

        entityFind = sandbox.stub(User.getDriver(), "findOne").callsFake(() => {
            return new QueryResult({ id: 1, firstName: "John", lastName: "Doe" });
        });

        assert.equal(await issue.get("assignedTo.firstName"), "John");
        assert.equal(await issue.get("assignedTo.lastName"), "Doe");

        entityFind.restore();
    });

    it("should return correct storage values", async () => {
        let entityFind = sandbox.stub(User.getDriver(), "findOne").callsFake(() => {
            return new QueryResult({ id: "xyz", assignedTo: "abc", assignedToClassId: "User" });
        });

        const issue = await Issue.findById(1);
        entityFind.restore();

        assert.equal(issue.id, "xyz");

        let storage = await issue.toStorage();
        assert.deepEqual(storage, {});

        issue.title = "new one";
        issue.assignedTo = "abcd";
        issue.assignedToClassId = "UserUpdated";
        storage = await issue.toStorage();
        assert.deepEqual(storage, {
            assignedTo: "abcd",
            assignedToClassId: "UserUpdated",
            title: "new one"
        });

        entityFind = sandbox.stub(User.getDriver(), "findOne").callsFake(() => {
            return new QueryResult({ id: "abc", firstName: "John", lastName: "Doe" });
        });

        await issue.assignedTo;
        entityFind.restore();

        storage = await issue.toStorage();
        assert.deepEqual(storage, {
            title: "new one",
            assignedTo: "abcd",
            assignedToClassId: "UserUpdated"
        });
    });
});
