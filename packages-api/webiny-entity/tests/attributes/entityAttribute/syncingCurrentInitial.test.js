import { assert } from "chai";

import { QueryResult } from "../../../src/index";
import { One, Two } from "../../entities/oneTwoThree";
import sinon from "sinon";

const sandbox = sinon.sandbox.create();

describe("entity attribute current / initial values syncing", function() {
    afterEach(() => sandbox.restore());

    it("should correctly sync current and initial values", async () => {
        let entityDelete = sandbox.spy(One.getDriver(), "delete");
        let entityFindById = sandbox
            .stub(One.getDriver(), "findById")
            .onCall(0)
            .callsFake(() => {
                return new QueryResult({ id: "one", name: "One", two: "two" });
            })
            .onCall(1)
            .callsFake(() => {
                return new QueryResult({ id: "two", name: "Two" });
            });

        const one = await One.findById("a");
        assert.equal(await one.getAttribute("two").getStorageValue(), "two");
        assert.equal(one.getAttribute("two").value.getCurrent(), "two");
        assert.equal(one.getAttribute("two").value.getInitial(), null);

        await one.set("two", { name: "Another Two" });

        entityFindById.restore();

        let entitySave = sandbox
            .stub(One.getDriver(), "save")
            .onCall(0)
            .callsFake(entity => {
                entity.id = "anotherTwo";
                return new QueryResult();
            })
            .onCall(1)
            .callsFake(() => {
                return new QueryResult();
            });

        await one.save();

        assert.equal(await one.getAttribute("two").getStorageValue(), "anotherTwo");
        assert.equal(one.getAttribute("two").value.getCurrent().id, "anotherTwo");
        assert.equal(one.getAttribute("two").value.getInitial().id, "anotherTwo");

        entityDelete.restore();
        entitySave.restore();
    });

    it("should correctly sync initial and current value when null is present", async () => {
        let entityDelete = sandbox.spy(One.getDriver(), "delete");
        let entityFindById = sandbox
            .stub(One.getDriver(), "findById")
            .onCall(0)
            .callsFake(() => {
                return new QueryResult({ id: "one", name: "One", two: null });
            });

        const one = await One.findById("a");
        assert.equal(await one.getAttribute("two").getStorageValue(), null);
        assert.equal(one.getAttribute("two").value.getCurrent(), null);
        assert.equal(one.getAttribute("two").value.getInitial(), null);

        await one.set("two", { name: "Another Two" });
        entityFindById.restore();

        assert.equal(await one.getAttribute("two").getStorageValue(), null);
        assert.equal(one.getAttribute("two").value.getCurrent().name, "Another Two");
        assert.equal(one.getAttribute("two").value.getInitial(), null);

        let entitySave = sandbox
            .stub(One.getDriver(), "save")
            .onCall(0)
            .callsFake(entity => {
                entity.id = "anotherTwo";
                return new QueryResult();
            })
            .onCall(1)
            .callsFake(() => {
                return new QueryResult();
            });

        await one.save();

        assert.equal(await one.getAttribute("two").getStorageValue(), "anotherTwo");
        assert.equal(one.getAttribute("two").value.getCurrent().id, "anotherTwo");
        assert.equal(one.getAttribute("two").value.getInitial().id, "anotherTwo");

        await one.set("two", null);

        assert.equal(await one.getAttribute("two").getStorageValue(), null);
        assert.equal(one.getAttribute("two").value.getCurrent(), null);
        assert.equal(one.getAttribute("two").value.getInitial().id, "anotherTwo");

        await one.save();

        assert.equal(await one.getAttribute("two").getStorageValue(), null);
        assert.equal(one.getAttribute("two").value.getCurrent(), null);
        assert.equal(one.getAttribute("two").value.getInitial(), null);

        entityDelete.restore();
        entitySave.restore();
    });
});
