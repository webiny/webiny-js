import { assert } from "chai";
import sinon from "sinon";
import { EntityAttributesContainer, QueryResult } from "webiny-entity";

import { Company, User, Issue } from "./entities/identityAttributeEntities";
import identityAttributeFactory from "../src/attributes/identityAttribute";
import Authentication from "../src/services/authentication";

const sandbox = sinon.sandbox.create();

describe("Identity attribute test", () => {
    before(() => {
        // Setup Authentication service
        const authentication = new Authentication({
            identities: [
                {
                    identity: User
                },
                {
                    identity: Company
                }
            ]
        });
        // Create IdentityAttribute class using the configured service
        const IdentityAttribute = identityAttributeFactory(authentication);

        // Register identity() attribute
        EntityAttributesContainer.prototype.identity = function() {
            const model = this.getParentModel();
            model.setAttribute(this.name, new IdentityAttribute(this.name, this));
            return model.getAttribute(this.name);
        };
    });
    afterEach(() => sandbox.restore());
    beforeEach(() => Issue.getEntityPool().flush());

    it("should assign value correctly", async () => {
        const user = new User();
        user.populate({ firstName: "John", lastName: "Doe" });

        const issue = new Issue();
        let identityAttribute = issue.getAttribute("assignedTo");

        issue.populate({ title: "testing custom attribute", assignedTo: user });

        assert.equal(issue.getAttribute("assignedTo").value.getCurrent().classId, "User");
        assert.equal(
            identityAttribute.value
                .getCurrent()
                .getAttribute("identity")
                .value.getCurrent().firstName,
            "John"
        );
        assert.equal(
            identityAttribute.value
                .getCurrent()
                .getAttribute("identity")
                .value.getCurrent().lastName,
            "Doe"
        );
        assert.instanceOf(
            identityAttribute.value
                .getCurrent()
                .getAttribute("identity")
                .value.getCurrent(),
            User
        );

        let identity = await issue.assignedTo;

        assert.equal(identity.firstName, "John");
        assert.equal(identity.lastName, "Doe");

        await issue.validate();

        identityAttribute = issue.getAttribute("assignedTo");

        issue.populate({
            title: "testing custom attribute",
            assignedTo: { classId: "Company", identity: { name: "Webiny" } }
        });

        assert.equal(identityAttribute.value.getCurrent().classId, "Company");
        assert.instanceOf(
            identityAttribute.value
                .getCurrent()
                .getAttribute("identity")
                .value.getCurrent(),
            Company
        );
        assert.equal(
            identityAttribute.value
                .getCurrent()
                .getAttribute("identity")
                .value.getCurrent().name,
            "Webiny"
        );

        await issue.validate();
    });

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
            return new QueryResult({ id: "xyz", assignedTo: "User:abc" });
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
            return new QueryResult({ id: "xyz", assignedTo: "User:abc" });
        });

        const issue = await Issue.findById(1);
        entityFind.restore();

        assert.equal(issue.id, "xyz");

        let storage = await issue.toStorage();
        assert.deepEqual(storage, {
            id: "xyz",
            title: null,
            assignedTo: "User:abc"
        });

        entityFind = sandbox.stub(User.getDriver(), "findOne").callsFake(() => {
            return new QueryResult({ id: "abc", firstName: "John", lastName: "Doe" });
        });

        await issue.assignedTo;
        entityFind.restore();

        storage = await issue.toStorage();
        assert.deepEqual(storage, {
            id: "xyz",
            title: null,
            assignedTo: "User:abc"
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

        assert.deepEqual(await user.toJSON("firstName,lastName"), {
            id: "abc",
            firstName: "John",
            lastName: "Doe"
        });
    });
});
