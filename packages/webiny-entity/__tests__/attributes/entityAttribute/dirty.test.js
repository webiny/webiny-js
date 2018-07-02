import { QueryResult } from "webiny-entity";
import { One } from "../../entities/oneTwoThree";
import sinon from "sinon";

const sandbox = sinon.sandbox.create();
const getEntity = async () => {
    const id =
        "_" +
        Math.random()
            .toString(36)
            .substr(2, 9);
    let entityFindById = sandbox
        .stub(One.getDriver(), "findOne")
        .onCall(0)
        .callsFake(() => {
            return new QueryResult({ id, name: "One", two: "two" });
        });

    const entity = await One.findById(id);
    entityFindById.restore();
    return entity;
};

describe("dirty flag test", () => {
    beforeEach(() => One.getEntityPool().flush());
    afterEach(() => sandbox.restore());

    test("when loading from storage, default value must be clean", async () => {
        const entity = await getEntity();
        const twoAttribute = entity.getAttribute("two");
        expect(twoAttribute.value.dirty).toBe(false);
    });

    test("new entity - when setting a value, dirty must be set as true only if different", async () => {
        let entity = new One();
        let twoAttribute = entity.getAttribute("two");

        entity.two = "anotherTwo";
        expect(twoAttribute.value.dirty).toBe(true);

        entity = new One();
        twoAttribute = entity.getAttribute("two");

        entity.two = null;
        expect(twoAttribute.value.dirty).toBe(false);

        entity = new One();
        twoAttribute = entity.getAttribute("two");

        entity.two = { something: true };
        expect(twoAttribute.value.dirty).toBe(true);

        entity = new One();
        twoAttribute = entity.getAttribute("two");

        entity.two = { id: "asd" };
        expect(twoAttribute.value.dirty).toBe(true);

        entity = new One();
        twoAttribute = entity.getAttribute("two");

        entity.two = { id: "asd", something: true };
        expect(twoAttribute.value.dirty).toBe(true);
    });

    test("loaded entity - when setting a value, dirty must be set as true only if different", async () => {
        let entity = await getEntity();
        let twoAttribute = entity.getAttribute("two");

        entity.two = "anotherTwo";
        expect(twoAttribute.value.dirty).toBe(true);

        entity = await getEntity();
        twoAttribute = entity.getAttribute("two");

        entity.two = "two";
        expect(twoAttribute.value.dirty).toBe(false);

        entity = await getEntity();
        twoAttribute = entity.getAttribute("two");

        entity.two = null;
        expect(twoAttribute.value.dirty).toBe(true);
    });

    test("when setting an object with ID, value must not be dirty if ID is same", async () => {
        let entity = await getEntity();
        let twoAttribute = entity.getAttribute("two");

        entity.two = { id: "two" };
        expect(twoAttribute.value.dirty).toBe(false);
    });

    test("when setting an object with ID but with additional fields, value must be set as dirty", async () => {
        let entity = await getEntity();
        let twoAttribute = entity.getAttribute("two");

        entity.two = { id: "two", someAttr: 1 };
        expect(twoAttribute.value.dirty).toBe(true);
    });

    test("should not be dirty when loading value from storage", async () => {
        const one = await getEntity();
        const twoAttribute = one.getAttribute("two");
        expect(twoAttribute.value.dirty).toBe(false);

        let findById = sandbox.stub(One.getDriver(), "findOne").callsFake(() => {
            return new QueryResult({ id: "two", name: "Two" });
        });

        const two = await one.two;
        expect(twoAttribute.value.isDirty()).toBe(false);

        two.name = "anotherName";

        expect(twoAttribute.value.isDirty()).toBe(true);

        findById.restore();
    });

    test("should save entity only if dirty, amd set it as clean after save", async () => {
        const one = await getEntity();

        let findById = sandbox.stub(One.getDriver(), "findOne").callsFake(() => {
            return new QueryResult({ id: "two", name: "Two" });
        });

        const two = await one.two;
        findById.restore();

        const entitySaveSpy = sandbox.spy(One.getDriver(), "save");

        await one.save();
        expect(entitySaveSpy.callCount).toEqual(0);

        two.name = "anotherName";
        expect(two.isDirty()).toBe(true);
        await one.save();
        expect(entitySaveSpy.callCount).toEqual(1);
        expect(two.isClean()).toBe(true);

        await one.save();
        expect(entitySaveSpy.callCount).toEqual(1);
        expect(two.isClean()).toBe(true);
    });
});
