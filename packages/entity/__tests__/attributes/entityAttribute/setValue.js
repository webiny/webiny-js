import { assert } from "chai";
import { One, Two } from "../../entities/oneTwoThree";
import { QueryResult } from "@webiny/entity";
import sinon from "sinon";

const sandbox = sinon.sandbox.create();

describe("populate test", function() {
    beforeEach(() => One.getEntityPool().flush());
    afterEach(() => sandbox.restore());

    it("should accept a valid ID", async () => {
        const one = new One();

        one.two = "two";

        assert.deepEqual(one.getAttribute("two").value.state, { loaded: false, loading: false });

        const findById = sandbox
            .stub(One.getDriver(), "findOne")
            .onCall(0)
            .callsFake(() => {
                return new QueryResult({ id: "two", name: "Two" });
            });

        assert.equal(await one.get("two.id"), "two");
        assert.equal(findById.callCount, 1);
        findById.restore();
    });

    it("should accept an invalid ID and return it when trying to get attribute's value", async () => {
        const one = new One();

        one.two = "invalidTwo";

        assert.deepEqual(one.getAttribute("two").value.state, { loaded: false, loading: false });

        const findById = sandbox.spy(One.getDriver(), "findOne");

        assert.equal(await one.two, "invalidTwo");
        assert.equal(findById.callCount, 1);
        findById.restore();
    });

    it("should accept an object with a valid ID", async () => {
        const one = new One();

        one.two = { id: "two" };

        assert.deepEqual(one.getAttribute("two").value.state, { loaded: false, loading: false });

        const findById = sandbox
            .stub(One.getDriver(), "findOne")
            .onCall(0)
            .callsFake(() => {
                return new QueryResult({ id: "two", name: "Two" });
            });

        assert.equal(await one.get("two.id"), "two");
        assert.instanceOf(await one.get("two"), Two);

        // Just in case, so we can be sure second find against storage wasn't executed.
        await one.get("two");

        assert.equal(findById.callCount, 1);

        findById.restore();
    });

    it("should accept an invalid ID inside an object and return it when trying to get attribute's value", async () => {
        const one = new One();

        one.two = { id: "invalidTwo" };

        assert.deepEqual(one.getAttribute("two").value.state, { loaded: false, loading: false });

        const findById = sandbox.spy(One.getDriver(), "findOne");

        assert.equal(await one.get("two.id"), "invalidTwo");
        assert.isObject(await one.get("two"), Two);
        assert.equal(findById.callCount, 2);
        assert.deepEqual(one.getAttribute("two").value.state, { loaded: false, loading: false });

        findById.restore();
    });

    it("after loading from storage, loaded entity must be populated with received object data", async () => {
        const one = new One();

        one.two = { id: "two", name: "Changed name" };

        assert.deepEqual(one.getAttribute("two").value.state, { loaded: false, loading: false });

        const findById = sandbox
            .stub(One.getDriver(), "findOne")
            .onCall(0)
            .callsFake(() => {
                return new QueryResult({ id: "two", name: "Two" });
            });

        assert.instanceOf(await one.two, Two);
        assert.equal(await one.get("two.id"), "two");
        assert.equal(await one.get("two.name"), "Changed name");

        assert.equal(findById.callCount, 1);
        findById.restore();
    });
});
