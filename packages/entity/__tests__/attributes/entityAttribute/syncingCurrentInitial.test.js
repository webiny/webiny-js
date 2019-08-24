import { QueryResult } from "@webiny/entity";
import { One, Two } from "../../entities/oneTwoThree";
import sinon from "sinon";
import { MainEntity } from "../../entities/entitiesAttributeEntities";

const sandbox = sinon.sandbox.create();

describe("entity attribute current / initial values syncing", () => {
    afterEach(() => sandbox.restore());
    beforeEach(() => MainEntity.getEntityPool().flush());

    test("should correctly sync current and initial values", async () => {
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
        expect(await one.getAttribute("two").getStorageValue()).toEqual("two");
        expect(one.getAttribute("two").value.getCurrent()).toEqual("two");
        expect(one.getAttribute("two").value.getInitial()).toEqual("two");

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

        expect(await one.getAttribute("two").getStorageValue()).toEqual("anotherTwo");
        expect(one.getAttribute("two").value.getCurrent().id).toEqual("anotherTwo");
        expect(one.getAttribute("two").value.getInitial().id).toEqual("anotherTwo");

        entityDelete.restore();
        entitySave.restore();
    });

    test("should correctly sync initial and current value when null is present", async () => {
        let entityDelete = sandbox.spy(One.getDriver(), "delete");
        let entityFindById = sandbox.stub(One.getDriver(), "findOne").callsFake(() => {
            return new QueryResult({ id: "one", name: "One", two: null });
        });

        const one = await One.findById("a");
        entityFindById.restore();

        expect(await one.getAttribute("two").getStorageValue()).toEqual(null);
        expect(one.getAttribute("two").value.getCurrent()).toEqual(null);
        expect(one.getAttribute("two").value.getInitial()).toEqual(null);

        await one.set("two", { name: "Another Two" });
        entityFindById.restore();

        expect(await one.getAttribute("two").getStorageValue()).toEqual(null);
        expect(one.getAttribute("two").value.getCurrent().name).toEqual("Another Two");
        expect(one.getAttribute("two").value.getInitial()).toEqual(null);

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

        expect(await one.getAttribute("two").getStorageValue()).toEqual("anotherTwo");
        expect(one.getAttribute("two").value.getCurrent().id).toEqual("anotherTwo");
        expect(one.getAttribute("two").value.getInitial().id).toEqual("anotherTwo");

        await one.set("two", null);

        expect(await one.getAttribute("two").getStorageValue()).toEqual(null);
        expect(one.getAttribute("two").value.getCurrent()).toEqual(null);
        expect(one.getAttribute("two").value.getInitial().id).toEqual("anotherTwo");

        await one.save();

        expect(await one.getAttribute("two").getStorageValue()).toEqual(null);
        expect(one.getAttribute("two").value.getCurrent()).toEqual(null);
        expect(one.getAttribute("two").value.getInitial()).toEqual(null);

        entityDelete.restore();
        entitySave.restore();
    });

    test("should not load when setting new values but again correctly sync when saving", async () => {
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
        expect(attrTwo.value.state).toEqual({ loading: false, loaded: false });

        one.two = { name: "Another Two" };
        await one.set("two", { name: "Another Two" });

        expect(attrTwo.value.state).toEqual({ loading: false, loaded: false });
        expect(attrTwo.value.current.name).toEqual("Another Two");

        expect(await one.get("two.name")).toEqual("Another Two");
        expect(attrTwo.value.state).toEqual({ loading: false, loaded: false });

        // Initial value wasn't loaded - will be loaded on save.
        expect(attrTwo.value.initial).toEqual("two");

        await one.save();

        expect(entitySave.callCount).toEqual(2);
        expect(one.id).toEqual("one");
        expect(attrTwo.value.state).toEqual({ loading: false, loaded: true });
        expect(attrTwo.value.current.id).toEqual("anotherTwo");
        expect(attrTwo.value.initial.id).toEqual("anotherTwo");

        // Also make sure deletes have been called on initially set entity (with id "two").
        expect(entityDelete.callCount).toEqual(1);

        entitySave.restore();
        entityDelete.restore();
        entityFindById.restore();
    });
});
