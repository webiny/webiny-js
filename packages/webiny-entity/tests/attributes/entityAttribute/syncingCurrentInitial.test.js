import { assert } from "chai";

import { QueryResult } from "../../../src/index";
import { One, Two } from "../../entities/oneTwoThree";
import sinon from "sinon";
import { MainEntity } from "../../entities/entitiesAttributeEntities";

const sandbox = sinon.sandbox.create();

describe("entity attribute current / initial values syncing", function() {
    afterEach(() => sandbox.restore());
    beforeEach(() => MainEntity.getEntityPool().flush());

    it("should correctly sync current and initial values", async () => {
        let entityDelete = sandbox.spy(One.getDriver(), "delete");
        let entityFindById = sandbox
            .stub(One.getDriver(), "findOne")
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
        assert.equal(one.getAttribute("two").value.getInitial(), "two");

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
        let entityFindById = sandbox.stub(One.getDriver(), "findOne").callsFake(() => {
            return new QueryResult({ id: "one", name: "One", two: null });
        });

        const one = await One.findById("a");
        entityFindById.restore();

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

    it("should not load when setting new values but again correctly sync when saving", async () => {
        let entityFindById = sandbox
            .stub(One.getDriver(), "findOne")
            .onCall(0)
            .callsFake(() => {
                return new QueryResult({ id: "one", name: "One", two: "two" });
            })
            .onCall(1)
            .callsFake(() => {
                return new QueryResult({ id: "two", name: "Two" });
            });

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

        const entityDelete = sandbox.stub(One.getDriver(), "delete").callsFake(() => {
            new QueryResult();
        });

        const one = await One.findById("a");
        const attrTwo = one.getAttribute("two");
        assert.deepEqual(attrTwo.value.state, { loading: false, loaded: false });

        one.two = { name: "Another Two" };
        await one.set("two", { name: "Another Two" });

        assert.deepEqual(attrTwo.value.state, { loading: false, loaded: false });
        assert.equal(attrTwo.value.current.name, "Another Two");

        assert.equal(await one.get("two.name"), "Another Two");
        assert.deepEqual(attrTwo.value.state, { loading: false, loaded: false });

        // Initial value wasn't loaded - will be loaded on save.
        assert.equal(attrTwo.value.initial, "two");

        await one.save();

        assert.equal(entitySave.callCount, 2);
        assert.equal(one.id, "one");
        assert.deepEqual(attrTwo.value.state, { loading: false, loaded: true });
        assert.deepEqual(attrTwo.value.current.id, "anotherTwo");
        assert.deepEqual(attrTwo.value.initial.id, "anotherTwo");

        // Also make sure deletes have been called on initially set entity (with id "two").
        assert.equal(entityDelete.callCount, 1);

        entitySave.restore();
        entityDelete.restore();
        entityFindById.restore();
    });
});
