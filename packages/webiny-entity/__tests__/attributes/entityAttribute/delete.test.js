import { QueryResult } from "webiny-entity";
import { User, Company } from "../../entities/userCompanyImage";
import { One } from "../../entities/oneTwoThree";
import { ClassA } from "../../entities/abc";
import { ClassADynamic, ClassBDynamic, ClassCDynamic } from "../../entities/abcDynamicAttribute";
import sinon from "sinon";

const sandbox = sinon.sandbox.create();

describe("entity delete test", () => {
    afterEach(() => sandbox.restore());

    test("auto delete must be manually enabled and canDelete must stop deletion if error was thrown", async () => {
        const user = new User();
        user.populate({
            firstName: "John",
            lastName: "Doe",
            markedAsCannotDelete: true,
            company: {
                name: "Company",
                markedAsCannotDelete: true,
                image: {
                    filename: "test.jpg",
                    size: 123.45,
                    markedAsCannotDelete: true
                }
            }
        });

        let entitySave = sandbox
            .stub(user.getDriver(), "save")
            .onCall(0)
            .callsFake(entity => {
                entity.id = "AA";
                return new QueryResult();
            })
            .onCall(1)
            .callsFake(entity => {
                entity.id = "BB";
                return new QueryResult();
            })
            .onCall(2)
            .callsFake(entity => {
                entity.id = "CC";
                return new QueryResult();
            });

        await user.save();
        entitySave.restore();

        let error = null;

        let entityDelete = sandbox.stub(user.getDriver(), "delete");
        try {
            await user.delete();
        } catch (e) {
            error = e;
        }

        expect(error).toBeInstanceOf(Error);
        expect(error.message).toEqual("Cannot delete Image entity");
        expect(entityDelete.notCalled).toBeTruthy();

        await user.set("company.image.markedAsCannotDelete", false);

        try {
            await user.delete();
        } catch (e) {
            error = e;
        }

        expect(error).toBeInstanceOf(Error);
        expect(error.message).toEqual("Cannot delete Company entity");
        expect(entityDelete.notCalled).toBeTruthy();

        await user.set("company.markedAsCannotDelete", false);

        try {
            await user.delete();
        } catch (e) {
            error = e;
        }

        expect(error).toBeInstanceOf(Error);
        expect(error.message).toEqual("Cannot delete User entity");
        expect(entityDelete.notCalled).toBeTruthy();

        await user.set("markedAsCannotDelete", false);

        await user.delete();

        entityDelete.restore();
        expect(entityDelete.calledThrice).toBeTruthy();
    });

    test("should properly delete linked entity even though they are not loaded (auto delete enabled)", async () => {
        let findById = sandbox
            .stub(One.getDriver(), "findOne")
            .onCall(0)
            .callsFake(() => {
                return new QueryResult({ id: "one", name: "One", two: "two" });
            })
            .onCall(1)
            .callsFake(() => {
                return new QueryResult({ id: "two", name: "Two", three: "three" });
            })
            .onCall(2)
            .callsFake(() => {
                return new QueryResult({
                    id: "three",
                    name: "Three",
                    four: "four",
                    anotherFour: "anotherFour",
                    five: "five",
                    six: "six"
                });
            })
            .onCall(3)
            .callsFake(() => {
                return new QueryResult({ id: "four", name: "Four" });
            })
            .onCall(4)
            .callsFake(() => {
                return new QueryResult({ id: "anotherFour", name: "Another Four" });
            })
            .onCall(5)
            .callsFake(() => {
                return new QueryResult({ id: "five", name: "Five" });
            })
            .onCall(6)
            .callsFake(() => {
                return new QueryResult({ id: "six", name: "Six" });
            });

        const one = await One.findById("one");

        let entityDelete = sandbox.stub(one.getDriver(), "delete");
        await one.delete();

        expect(entityDelete.callCount).toEqual(7);

        findById.restore();
        entityDelete.restore();
    });

    test("should not delete linked entities if main entity is deleted and auto delete is not enabled", async () => {
        const entityFindById = sandbox
            .stub(ClassA.getDriver(), "findOne")
            .onCall(0)
            .callsFake(() => {
                return new QueryResult({ id: "classA", name: "ClassA" });
            });

        const classA = await ClassA.findById("classA");
        entityFindById.restore();

        classA.classB = { name: "classB", classC: { name: "classC" } };

        const entitySave = sandbox
            .stub(classA.getDriver(), "save")
            .onCall(0)
            .callsFake(entity => {
                entity.id = "classC";
                return new QueryResult();
            })
            .onCall(1)
            .callsFake(entity => {
                entity.id = "classB";
                return new QueryResult();
            })
            .onCall(2)
            .callsFake(() => {
                return new QueryResult();
            });

        await classA.save();
        entitySave.restore();

        expect(entitySave.calledThrice).toBeTruthy();

        expect(classA.id).toEqual("classA");

        const classB = await classA.classB;
        expect(classB.id).toEqual("classB");

        const classC = await classB.classC;
        expect(classC.id).toEqual("classC");

        expect(await classA.getAttribute("classB").getStorageValue()).toEqual("classB");
        expect(await classB.getAttribute("classC").getStorageValue()).toEqual("classC");

        const entityDelete = sandbox
            .stub(ClassA.getDriver(), "delete")
            .onCall(0)
            .callsFake(() => {
                return new QueryResult();
            });

        await classA.delete();
        expect(entityDelete.calledOnce).toBeTruthy();

        entityDelete.restore();
    });

    test("should not attempt to delete linked entities if attribute is set as dynamic", async () => {
        const entityFindById = sandbox
            .stub(ClassADynamic.getDriver(), "findOne")
            .onCall(0)
            .callsFake(() => {
                return new QueryResult({ id: "classADynamic", name: "ClassADynamic" });
            });

        const classADynamic = await ClassADynamic.findById("classADynamic");
        entityFindById.restore();

        const entitySave = sandbox
            .stub(classADynamic.getDriver(), "save")
            .onCall(0)
            .callsFake(() => {
                return new QueryResult();
            })
            .onCall(1)
            .callsFake(() => {
                return new QueryResult();
            });

        await classADynamic.save();
        expect(entitySave.callCount).toBe(0);

        classADynamic.name = "now it should save because of this dirty attribute";
        await classADynamic.save();

        await classADynamic.save();
        entitySave.restore();
        expect(entitySave.callCount).toBe(1);

        const entityDelete = sandbox
            .stub(ClassADynamic.getDriver(), "delete")
            .onCall(0)
            .callsFake(() => {
                return new QueryResult();
            });

        await classADynamic.delete();
        expect(entitySave.callCount).toBe(1);

        entityDelete.restore();
    });
});
