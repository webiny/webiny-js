import { One, Two } from "../../entities/oneTwoThree";
import { QueryResult } from "webiny-entity";
import sinon from "sinon";

const sandbox = sinon.sandbox.create();

describe("populate test", () => {
    beforeEach(() => One.getEntityPool().flush());
    afterEach(() => sandbox.restore());

    test("should not load anything if no ID was received from storage", async () => {
        const findById = sandbox
            .stub(One.getDriver(), "findOne")
            .onCall(0)
            .callsFake(() => {
                return new QueryResult({ id: "one", name: "One" });
            });

        const entity = await One.findById("one");
        expect(entity.getAttribute("two").value.state).toEqual({ loaded: false, loading: false });
        await entity.two;
        expect(entity.getAttribute("two").value.state).toEqual({ loaded: true, loading: false });
        expect(await entity.two).toBeNull();

        findById.restore();
    });

    test("should load entity if received an ID from storage", async () => {
        let findById = sandbox
            .stub(One.getDriver(), "findOne")
            .onCall(0)
            .callsFake(() => {
                return new QueryResult({ id: "one", name: "One", two: "two" });
            });

        const entity = await One.findById("one");
        expect(entity.getAttribute("two").value.state).toEqual({ loaded: false, loading: false });

        findById.restore();

        findById = sandbox.stub(One.getDriver(), "findOne").callsFake(() => {
            return new QueryResult({ id: "two", name: "Two" });
        });

        await entity.two;
        expect(entity.getAttribute("two").value.state).toEqual({ loaded: true, loading: false });
        expect(await entity.two).toBeInstanceOf(Two);
        expect(await entity.get("two.id")).toEqual("two");

        findById.restore();
    });

    test("when a new value is set, attribute should not load anything even though storage value exists", async () => {
        let findOneSpy = sandbox.spy(One.getDriver(), "findOne");
        const entity1 = new One();
        expect(entity1.getAttribute("two").value.state).toEqual({
            loaded: false,
            loading: false
        });
        entity1.two = { id: "invalidTwo" };
        expect(entity1.getAttribute("two").value.state).toEqual({
            loaded: false,
            loading: false
        });

        expect(typeof (await entity1.two)).toBe("object");
        expect(entity1.getAttribute("two").value.state).toEqual({
            loaded: false,
            loading: false
        });

        expect(findOneSpy.callCount).toEqual(1);
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

        expect(entity2.getAttribute("two").value.state).toEqual({
            loaded: false,
            loading: false
        });

        entity1.two = { id: "invalidTwo" };

        expect(entity2.getAttribute("two").value.state).toEqual({
            loaded: false,
            loading: false
        });

        expect(await entity1.two).toEqual({ id: "invalidTwo" });
        expect(findOneSpy.callCount).toEqual(1);
        findOneSpy.restore();
    });

    test("when a new id is set, getting the value should return a loaded instance", async () => {
        const one = new One();

        one.two = { id: "newTwo" };

        expect(one.getAttribute("two").value.state).toEqual({ loaded: false, loading: false });

        let findById = sandbox.stub(One.getDriver(), "findOne").callsFake(() => {
            return new QueryResult({ id: "newTwo", name: "New Two" });
        });

        await one.two;

        expect(await one.get("two.id")).toEqual("newTwo");
        expect(await one.get("two.name")).toEqual("New Two");
        expect(findById.callCount).toEqual(1);
        expect(one.getAttribute("two").value.state).toEqual({ loaded: false, loading: false });

        findById.restore();
    });

    test("when an invalid id is set, getting the value should return initially set value", async () => {
        const one = new One();

        one.two = { id: "newTwo" };

        expect(one.getAttribute("two").value.state).toEqual({ loaded: false, loading: false });

        const findById = sandbox.spy(One.getDriver(), "findOne");
        const two = await one.two;
        expect(findById.callCount).toEqual(1);
        expect(two).toEqual({ id: "newTwo" });

        expect(one.getAttribute("two").value.state).toEqual({ loaded: false, loading: false });

        findById.restore();
    });

    test("when loading an instance from passed ID, load must happen only on first call", async () => {
        const one = new One();

        one.two = { id: "newTwo" };

        expect(one.getAttribute("two").value.state).toEqual({ loaded: false, loading: false });

        let findById = sandbox.stub(One.getDriver(), "findOne").callsFake(() => {
            return new QueryResult({ id: "newTwo", name: "New Two" });
        });

        await one.two;
        await one.two;
        await one.two;

        expect(findById.callCount).toEqual(1);
        expect(one.getAttribute("two").value.state).toEqual({ loaded: false, loading: false });

        findById.restore();
    });

    test("should get values correctly even on multiple set calls", async () => {
        const one = new One();

        one.two = { id: "newTwo" };

        expect(one.getAttribute("two").value.state).toEqual({ loaded: false, loading: false });

        let findById = sandbox.stub(One.getDriver(), "findOne").callsFake(() => {
            return new QueryResult({ id: "newTwo", name: "New Two" });
        });

        await one.two;

        expect(findById.callCount).toEqual(1);
        expect(one.getAttribute("two").value.state).toEqual({ loaded: false, loading: false });
        expect(await one.two).toBeInstanceOf(Two);
        expect(await one.get("two.name")).toEqual("New Two");

        one.two = null;

        expect(await one.two).toBeNull();
        expect(findById.callCount).toEqual(1);
        expect(one.getAttribute("two").value.state).toEqual({ loaded: false, loading: false });

        const newTwo = new Two();
        newTwo.name = "Again new Two";

        one.two = newTwo;

        expect(findById.callCount).toEqual(1);
        expect(one.getAttribute("two").value.state).toEqual({ loaded: false, loading: false });
        expect(await one.two).toBeInstanceOf(Two);
        expect(await one.get("two.name")).toEqual("Again new Two");

        findById.restore();
    });
});
