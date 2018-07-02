import { QueryResult } from "webiny-entity";
import { Company, User, Issue } from "./entities/identityAttributeEntities";
import { MemoryDriver } from "webiny-entity-memory";
import { Entity } from "webiny-api/entities";
import { api } from "webiny-api";
import JwtToken from "webiny-api/security/tokens/jwtToken";
import registerIdentityAttribute from "webiny-api/attributes/registerIdentityAttribute";
import registerPasswordAttribute from "webiny-api/attributes/registerPasswordAttribute";
import SecurityService from "webiny-api/services/securityService";

import sinon from "sinon";
const sandbox = sinon.sandbox.create();
describe("Identity attribute test", () => {
    beforeAll(async () => {
        // Register service (for identity attribute).
        api.services.register("security", () => {
            return new SecurityService({
                token: new JwtToken({ secret: "MyS3cr3tK3Y" }),
                identities: [{ identity: User }, { identity: Company }]
            });
        });

        // Register attributes.
        registerIdentityAttribute();
        registerPasswordAttribute();

        // Configure Memory entity driver.
        Entity.driver = new MemoryDriver();
    });

    afterEach(() => sandbox.restore());
    beforeEach(() => Issue.getEntityPool().flush());

    it("should assign value correctly", async () => {
        const user = new User();
        user.populate({ firstName: "John", lastName: "Doe" });

        const issue = new Issue();
        let issueIdentityAttribute = issue.getAttribute("assignedTo");
        expect(await issueIdentityAttribute.getValue()).toBeNull();
        issueIdentityAttribute.setStorageValue(null);
        expect(await issueIdentityAttribute.getStorageValue()).toBeNull();

        issue.populate({ title: "testing custom attribute", assignedTo: user });

        await issue.assignedTo;
        expect(await issue.getAttribute("assignedTo").value.getCurrent().classId).toBe("User");

        await issue.assignedTo;

        expect(issueIdentityAttribute.value.getCurrent().firstName).toBe("John");
        expect(issueIdentityAttribute.value.getCurrent().lastName).toBe("Doe");
        expect(issueIdentityAttribute.value.getCurrent()).toBeInstanceOf(User);

        let identity = await issue.assignedTo;

        expect(identity.firstName).toBe("John");
        expect(identity.lastName).toBe("Doe");
        await issue.save();
        await issue.validate();

        issueIdentityAttribute = issue.getAttribute("assignedTo");

        issue.populate({
            title: "testing custom attribute",
            assignedToClassId: "Company",
            assignedTo: { name: "Webiny" }
        });

        await issue.assignedTo;

        expect(issueIdentityAttribute.value.getCurrent().classId).toBe("Company");
        expect(issueIdentityAttribute.value.getCurrent()).toBeInstanceOf(Company);
        expect(issueIdentityAttribute.value.getCurrent().name).toBe("Webiny");

        await issue.validate();
    });

    it("should be able to work with a custom attribute", async () => {
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

    it("should load entities from database", async () => {
        let entityFind = sandbox.stub(User.getDriver(), "findOne").callsFake(() => {
            return new QueryResult({ id: "xyz", assignedTo: "abc", assignedToClassId: "User" });
        });

        const issue = await Issue.findById(1);
        entityFind.restore();

        expect(issue.id).toBe("xyz");

        entityFind = sandbox.stub(User.getDriver(), "findOne").callsFake(() => {
            return new QueryResult({ id: 1, firstName: "John", lastName: "Doe" });
        });

        expect(await issue.get("assignedTo.firstName")).toBe("John");
        expect(await issue.get("assignedTo.lastName")).toBe("Doe");

        entityFind.restore();
    });

    it("should return correct storage values", async () => {
        let entityFind = sandbox.stub(User.getDriver(), "findOne").callsFake(() => {
            return new QueryResult({ id: "xyzabc", assignedToClassId: "User", assignedTo: "abc" });
        });

        const issue = await Issue.findById("xyzabc");
        entityFind.restore();

        expect(issue.id).toBe("xyzabc");

        let storage = await issue.toStorage();
        expect(storage).toEqual({
            deleted: false
        });

        entityFind = sandbox.stub(User.getDriver(), "findOne").callsFake(() => {
            return new QueryResult({ id: "abc", firstName: "John", lastName: "Doe" });
        });

        await issue.assignedTo;
        entityFind.restore();

        storage = await issue.toStorage();
        expect(storage).toEqual({
            assignedTo: "abc",
            deleted: false
        });
    });

    it("should be able to save with or without attribute value", async () => {
        const issue = new Issue();
        let entitySave = sandbox.stub(User.getDriver(), "save").callsFake(entity => {
            entity.id = "xyz";
            new QueryResult();
        });

        issue.title = "Test";
        await issue.save();
        entitySave.restore();

        const user = new User();
        user.firstName = "John";
        user.lastName = "Doe";

        issue.assignedTo = user;

        entitySave = sandbox
            .stub(User.getDriver(), "save")
            .onCall(1)
            .callsFake(() => {
                new QueryResult();
            })
            .onCall(0)
            .callsFake(entity => {
                entity.id = "abc";
                new QueryResult();
            });

        await issue.save();
        entitySave.restore();

        expect(await user.toJSON("firstName,lastName")).toEqual({
            id: "abc",
            firstName: "John",
            lastName: "Doe"
        });
    });
});
