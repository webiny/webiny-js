import { Issue, User, Company } from "./../entities/customAttributeEntities";
import sinon from "sinon";
import { QueryResult } from "webiny-entity";

const sandbox = sinon.sandbox.create();

describe("custom attribute test", () => {
    afterEach(() => sandbox.restore());
    beforeEach(() => User.getEntityPool().flush());

    test("should be able to work with a custom attribute", async () => {
        const user = new User();
        user.populate({ firstName: "John", lastName: "Doe" });

        const issue1 = new Issue();
        issue1.populate({ title: "testing custom attribute", assignedTo: user });

        const json1 = await issue1.toJSON("title,assignedTo[firstName,lastName]");
        expect(json1).toEqual({
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
        expect(json2).toEqual({
            id: null,
            assignedTo: {
                name: "Webiny"
            },
            title: "testing custom attribute"
        });
    });

    test("should load entities from database", async () => {
        let entityFind = sandbox.stub(User.getDriver(), "findOne").callsFake(() => {
            return new QueryResult({ id: "xyz", assignedTo: "abc", assignedToClassId: "User" });
        });

        const issue = await Issue.findById(1);
        entityFind.restore();

        expect(issue.id).toEqual("xyz");

        entityFind = sandbox.stub(User.getDriver(), "findOne").callsFake(() => {
            return new QueryResult({ id: 1, firstName: "John", lastName: "Doe" });
        });

        expect(await issue.get("assignedTo.firstName")).toEqual("John");
        expect(await issue.get("assignedTo.lastName")).toEqual("Doe");

        entityFind.restore();
    });

    test("should return correct storage values", async () => {
        let entityFind = sandbox.stub(User.getDriver(), "findOne").callsFake(() => {
            return new QueryResult({ id: "xyz", assignedTo: "abc", assignedToClassId: "User" });
        });

        const issue = await Issue.findById(1);
        entityFind.restore();

        expect(issue.id).toEqual("xyz");

        let storage = await issue.toStorage();
        expect(storage).toEqual({});

        issue.title = "new one";
        issue.assignedTo = "abcd";
        issue.assignedToClassId = "UserUpdated";
        storage = await issue.toStorage();
        expect(storage).toEqual({
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
        expect(storage).toEqual({
            title: "new one",
            assignedTo: "abcd",
            assignedToClassId: "UserUpdated"
        });
    });
});
