import { assert } from "chai";
import { User, Image } from "./entities/userCompanyImage";
import sinon from "sinon";
import { QueryResult } from "./../lib";

const sandbox = sinon.sandbox.create();

describe("async get and set methods test", async function() {
    afterEach(() => sandbox.restore());
    beforeEach(() => User.getEntityPool().flush());

    it("should be able to get simple attributes", async () => {
        const user = new User();
        await user.set("firstName", "John");
        await user.set("lastName", "Doe");

        assert.equal(await user.get("firstName"), "John");
        assert.equal(await user.get("lastName"), "Doe");
    });

    it("should be able to get simple attributes", async () => {
        const user = new User();
        await user.set("firstName", "John");
        await user.set("lastName", "Doe");

        assert.equal(await user.get("firstName"), "John");
        assert.equal(await user.get("lastName"), "Doe");
    });

    it("should return empty object if path not set", async () => {
        const user = new User();
        await user.set("firstName", "John");
        await user.set("lastName", "Doe");

        assert.isUndefined(await user.get());
    });

    it("should return default value properly", async () => {
        const user = new User();
        await user.set("firstName", "John");
        await user.set("lastName", "Doe");

        assert.equal(await user.get("firstName", "Test"), "John");
        assert.isUndefined(await user.get("firstName1"));
        assert.equal(await user.get("firstName1", "Test"), "Test");
    });

    it("should be able to get values from nested entities", async () => {
        const findById = sandbox
            .stub(User.getDriver(), "findOne")
            .onCall(0)
            .callsFake(() => {
                return new QueryResult({
                    id: "A",
                    firstName: "John",
                    lastName: "Doe",
                    company: "B"
                });
            })
            .onCall(1)
            .callsFake(() => {
                return new QueryResult({ id: "B", name: "TestCompany", image: "C" });
            })
            .onCall(2)
            .callsFake(() => {
                return new QueryResult({
                    id: "C",
                    size: 12,
                    markedAsCannotDelete: true,
                    filename: "test.jpg",
                    createdBy: "A"
                });
            });

        const user = await User.findById("A");

        const image = await user.get("company.image");

        assert(findById.calledThrice);
        findById.restore();

        assert.instanceOf(image, Image);

        assert.equal(await user.get("company.image.id"), "C");
        assert.equal(await user.get("company.image.filename"), "test.jpg");
        assert.equal(await image.getAttribute("createdBy").value.getCurrent(), "A");
    });

    it("should be able to directly set values into nested entities", async () => {
        const findById = sandbox
            .stub(User.getDriver(), "findOne")
            .onCall(0)
            .callsFake(() => {
                return new QueryResult({
                    id: "A",
                    firstName: "John",
                    lastName: "Doe",
                    company: "B"
                });
            })
            .onCall(1)
            .callsFake(() => {
                return new QueryResult({ id: "B", name: "TestCompany", image: "C" });
            })
            .onCall(2)
            .callsFake(() => {
                return new QueryResult({
                    id: "C",
                    size: 12,
                    markedAsCannotDelete: true,
                    filename: "test.jpg",
                    createdBy: "A"
                });
            });

        const user = await User.findById("A");

        await user.set("company.name", "Test");
        assert.equal(await user.get("company.name"), "Test");

        assert.equal((await user.get("company")).getAttribute("image").value.getCurrent(), "C");

        await user.set("company.image.filename", "another.test.jpg");
        assert.instanceOf(await user.get("company.image"), Image);
        assert.equal(await user.get("company.image.filename"), "another.test.jpg");

        assert(findById.calledThrice);
        findById.restore();
    });
});
