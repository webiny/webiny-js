import { assert } from "chai";

import { QueryResult } from "../../../src/index";
import { User, Company } from "../../entities/userCompanyImage";
import { One } from "../../entities/oneTwoThree";
import { ClassA } from "../../entities/abc";
import sinon from "sinon";

const sandbox = sinon.sandbox.create();

describe("entity delete test", function() {
    afterEach(() => sandbox.restore());

    it("auto delete must be manually enabled and canDelete must stop deletion if error was thrown", async () => {
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

        assert.instanceOf(error, Error);
        assert.equal(error.message, "Cannot delete Image entity");
        assert(entityDelete.notCalled);

        await user.set("company.image.markedAsCannotDelete", false);

        try {
            await user.delete();
        } catch (e) {
            error = e;
        }

        assert.instanceOf(error, Error);
        assert.equal(error.message, "Cannot delete Company entity");
        assert(entityDelete.notCalled);

        await user.set("company.markedAsCannotDelete", false);

        try {
            await user.delete();
        } catch (e) {
            error = e;
        }

        assert.instanceOf(error, Error);
        assert.equal(error.message, "Cannot delete User entity");
        assert(entityDelete.notCalled);

        await user.set("markedAsCannotDelete", false);

        await user.delete();

        entityDelete.restore();
        assert(entityDelete.calledThrice);
    });

    it("should properly delete linked entity even though they are not loaded (auto delete enabled)", async () => {
        let findById = sandbox
            .stub(One.getDriver(), "findById")
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

        assert.equal(entityDelete.callCount, 7);

        findById.restore();
        entityDelete.restore();
    });

    it("should not delete linked entities if main entity is deleted and auto delete is not enabled", async () => {
        const entityFindById = sandbox
            .stub(ClassA.getDriver(), "findById")
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

        assert(entitySave.calledThrice);

        assert.equal(classA.id, "classA");

        const classB = await classA.classB;
        assert.equal(classB.id, "classB");

        const classC = await classB.classC;
        assert.equal(classC.id, "classC");

        assert.equal(await classA.getAttribute("classB").getStorageValue(), "classB");
        assert.equal(await classB.getAttribute("classC").getStorageValue(), "classC");

        const entityDelete = sandbox
            .stub(ClassA.getDriver(), "delete")
            .onCall(0)
            .callsFake(() => {
                return new QueryResult();
            });

        await classA.delete();
        assert(entityDelete.calledOnce);

        entityDelete.restore();
    });
});
