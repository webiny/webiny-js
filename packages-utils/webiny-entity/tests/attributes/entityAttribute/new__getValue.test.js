import { assert } from "chai";
import { One, Two } from "../../entities/oneTwoThree";
import { QueryResult } from "../../../src";
import sinon from "sinon";

const sandbox = sinon.sandbox.create();

describe("populate test", function() {
    beforeEach(() => One.getEntityPool().flush());
    afterEach(() => sandbox.restore());

    it("√√√ should not load anything if no ID was received from storage", async () => {
        const findById = sandbox
            .stub(One.getDriver(), "findOne")
            .onCall(0)
            .callsFake(() => {
                return new QueryResult({ id: "one", name: "One" });
            });

        const entity = await One.findById("one");
        assert.deepEqual(entity.getAttribute("two").value.state, { loaded: false, loading: false });
        await entity.two;
        assert.deepEqual(entity.getAttribute("two").value.state, { loaded: true, loading: false });
        assert.isNull(await entity.two);

        findById.restore();
    });

    it("√√√ should load entity if received an ID from storage", async () => {
        let findById = sandbox
            .stub(One.getDriver(), "findOne")
            .onCall(0)
            .callsFake(() => {
                return new QueryResult({ id: "one", name: "One", two: "two" });
            });

        const entity = await One.findById("one");
        assert.deepEqual(entity.getAttribute("two").value.state, { loaded: false, loading: false });

        findById.restore();

        findById = sandbox.stub(One.getDriver(), "findOne").callsFake(() => {
            return new QueryResult({ id: "two", name: "Two" });
        });

        await entity.two;
        assert.deepEqual(entity.getAttribute("two").value.state, { loaded: true, loading: false });
        assert.instanceOf(await entity.two, Two);
        assert.equal(await entity.get("two.id"), "two");

        findById.restore();
    });

    it("√√√ when a new value is set, attribute should not load anything even though storage value exists", async () => {
        let findOneSpy = sandbox.spy(One.getDriver(), "findOne");
        const entity1 = new One();
        assert.deepEqual(entity1.getAttribute("two").value.state, {
            loaded: false,
            loading: false
        });
        entity1.two = { id: "invalidTwo" };
        assert.deepEqual(entity1.getAttribute("two").value.state, {
            loaded: false,
            loading: false
        });

        assert.isObject(await entity1.two, Two);
        assert.deepEqual(entity1.getAttribute("two").value.state, {
            loaded: false,
            loading: false
        });

        assert.equal(findOneSpy.callCount, 1);
        findOneSpy.restore();

        const findById = sandbox
            .stub(One.getDriver(), "findOne")
            .onCall(0)
            .callsFake(() => {
                return new QueryResult({ id: "one", name: "One", two: "two" });
            });

        const entity2 = await One.findById("one");
        findById.restore();

        findOneSpy = sandbox.spy(One.getDriver(), "findOne");

        assert.deepEqual(entity2.getAttribute("two").value.state, {
            loaded: false,
            loading: false
        });

        entity1.two = { id: "invalidTwo" };

        assert.deepEqual(entity2.getAttribute("two").value.state, {
            loaded: false,
            loading: false
        });

        assert.deepEqual(await entity1.two, { id: "invalidTwo" });
        assert.equal(findOneSpy.callCount, 1);
        findOneSpy.restore();
    });

    it("√√√ when a new id is set, getting the value should return a loaded instance", async () => {
        const one = new One();

        one.two = { id: "newTwo" };

        assert.deepEqual(one.getAttribute("two").value.state, { loaded: false, loading: false });

        let findById = sandbox.stub(One.getDriver(), "findOne").callsFake(() => {
            return new QueryResult({ id: "newTwo", name: "New Two" });
        });

        await one.two;

        assert.equal(await one.get("two.id"), "newTwo");
        assert.equal(await one.get("two.name"), "New Two");
        assert.equal(findById.callCount, 1);
        assert.deepEqual(one.getAttribute("two").value.state, { loaded: false, loading: false });

        findById.restore();
    });

    it("√√√ when an invalid id is set, getting the value should return initially set value", async () => {
        const one = new One();

        one.two = { id: "newTwo" };

        assert.deepEqual(one.getAttribute("two").value.state, { loaded: false, loading: false });

        const findById = sandbox.spy(One.getDriver(), "findOne");
        const two = await one.two;
        assert.equal(findById.callCount, 1);
        assert.deepEqual(two, { id: "newTwo" });

        assert.deepEqual(one.getAttribute("two").value.state, { loaded: false, loading: false });

        findById.restore();
    });

    it("√√√ when loading an instance from passed ID, load must happen only on first call", async () => {
        const one = new One();

        one.two = { id: "newTwo" };

        assert.deepEqual(one.getAttribute("two").value.state, { loaded: false, loading: false });

        let findById = sandbox.stub(One.getDriver(), "findOne").callsFake(() => {
            return new QueryResult({ id: "newTwo", name: "New Two" });
        });

        await one.two;
        await one.two;
        await one.two;

        assert.equal(findById.callCount, 1);
        assert.deepEqual(one.getAttribute("two").value.state, { loaded: false, loading: false });

        findById.restore();
    });

    it("should get values correctly even on multiple set calls", async () => {
        const one = new One();

        one.two = { id: "newTwo" };

        assert.deepEqual(one.getAttribute("two").value.state, { loaded: false, loading: false });

        let findById = sandbox.stub(One.getDriver(), "findOne").callsFake(() => {
            return new QueryResult({ id: "newTwo", name: "New Two" });
        });

        await one.two;

        assert.equal(findById.callCount, 1);
        assert.deepEqual(one.getAttribute("two").value.state, { loaded: false, loading: false });
        assert.instanceOf(await one.two, Two);
        assert.equal(await one.get("two.name"), "New Two");

        one.two = null;

        assert.isNull(await one.two);
        assert.equal(findById.callCount, 1);
        assert.deepEqual(one.getAttribute("two").value.state, { loaded: false, loading: false });

        const newTwo = new Two();
        newTwo.name = "Again new Two";

        one.two = newTwo;

        assert.equal(findById.callCount, 1);
        assert.deepEqual(one.getAttribute("two").value.state, { loaded: false, loading: false });
        assert.instanceOf(await one.two, Two);
        assert.equal(await one.get("two.name"), "Again new Two");

        findById.restore();
    });
});
