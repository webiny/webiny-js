import { assert } from "chai";

import { QueryResult } from "../../../src/index";
import { User, Company } from "../../entities/userCompanyImage";
import { One } from "../../entities/oneTwoThree";
import sinon from "sinon";

const sandbox = sinon.sandbox.create();

describe("entity attribute test", function() {
    afterEach(() => sandbox.restore());
    beforeEach(() => User.getEntityPool().flush());

    it("should return entity from storage", async () => {
        const entity = new User();
        entity.getAttribute("company").setStorageValue("A");
        assert.equal(entity.getAttribute("company").value.getCurrent(), "A");

        sandbox.stub(entity.getDriver(), "findOne").callsFake(() => {
            return new QueryResult({ id: "A", name: "TestCompany" });
        });

        const company = await entity.company;
        entity.getDriver().findOne.restore();

        assert.instanceOf(company, Company);
        entity.company.name = "TestCompany";
    });

    it("should return correct storage value", async () => {
        const entity = new User();

        entity.getAttribute("company").setStorageValue(1);
        assert.equal(await entity.getAttribute("company").getStorageValue(), 1);

        const findById = sandbox
            .stub(entity.getDriver(), "findOne")
            .onCall(0)
            .callsFake(() => {
                return new QueryResult({ id: 1, name: "TestCompany" });
            })
            .onCall(1)
            .callsFake(entity => {
                entity.id = "B";
                return new QueryResult();
            });

        entity.company = { id: 5, name: "Test-1" };
        assert.equal(await entity.getAttribute("company").getStorageValue(), 5);

        entity.company = null;
        assert.equal(await entity.getAttribute("company").getStorageValue(), null);

        findById.restore();
    });

    it("it should auto save linked entity only if it is enabled", async () => {
        const user = new User();

        let save = sandbox.stub(user.getDriver(), "save").callsFake(entity => {
            entity.id = "A";
            return new QueryResult();
        });

        user.populate({
            firstName: "John",
            lastName: "Doe",
            company: {
                name: "Company",
                image: {
                    size: 123.45,
                    filename: "test.jpg"
                }
            }
        });

        user.getAttribute("company").setAutoSave(false);
        user
            .getAttribute("company")
            .value.getCurrent()
            .getAttribute("image")
            .setAutoSave(false);

        await user.save();

        save.restore();

        assert(save.calledOnce);
        assert.equal(user.id, "A");

        user.getAttribute("company").setAutoSave();

        // This time we should have an update on User entity, and insert on linked company entity
        save = sandbox
            .stub(user.getDriver(), "save")
            .onCall(0)
            .callsFake(entity => {
                entity.id = "B";
                return new QueryResult();
            })
            .onCall(1)
            .callsFake(() => {
                return new QueryResult();
            });

        await user.save();

        save.restore();

        assert(save.calledTwice);
        assert.equal(user.id, "A");
        assert.equal(await user.get("company.id"), "B");

        // Finally, let's put auto save on image entity too.

        user
            .getAttribute("company")
            .value.getCurrent()
            .getAttribute("image")
            .setAutoSave();

        // This time we should have an update on User entity, update on company entity and insert on linked image entity.
        // Additionally, image entity has a createdBy attribute, but since it's empty, nothing must happen here.

        save = sandbox
            .stub(user.getDriver(), "save")
            .onCall(0)
            .callsFake(entity => {
                entity.id = "C";
                return new QueryResult();
            })
            .onCall(1)
            .callsFake(() => {
                return new QueryResult();
            })
            .onCall(2)
            .callsFake(() => {
                return new QueryResult();
            });

        try {
            await user.save();
        } catch (e) {
            const bbb = 123;
        }
        save.restore();

        assert(save.calledThrice);
        assert.equal(user.id, "A");
        assert.equal(await user.get("company.id"), "B");
        assert.equal(await user.get("company.image.id"), "C");
    });

    it("auto save must be automatically enabled", async () => {
        const user = new User();
        user.populate({
            firstName: "John",
            lastName: "Doe",
            company: {
                name: "Company",
                image: {
                    size: 123.45,
                    filename: "test.jpg"
                }
            }
        });

        let save = sandbox
            .stub(user.getDriver(), "save")
            .onCall(0)
            .callsFake(entity => {
                entity.id = "C";
                return new QueryResult();
            })
            .onCall(1)
            .callsFake(entity => {
                entity.id = "B";
                return new QueryResult();
            })
            .onCall(2)
            .callsFake(entity => {
                entity.id = "A";
                return new QueryResult();
            });

        await user.save();
        save.restore();

        assert(save.calledThrice);
        assert.equal(user.id, "A");
        assert.equal(await user.get("company.id"), "B");
        assert.equal(await user.get("company.image.id"), "C");
    });

    it("should not trigger saving of same entity (that might be also linked in an another linked entity) twice in one save process", async () => {
        const user = new User();
        user.populate({
            firstName: "John",
            lastName: "Doe",
            company: {
                name: "Company",
                image: {
                    size: 123.45,
                    filename: "test.jpg",
                    createdBy: user
                }
            }
        });
        await user.save();

        let save = sandbox
            .stub(user.getDriver(), "save")
            .onCall(0)
            .callsFake(entity => {
                entity.id = "C";
                return new QueryResult();
            })
            .onCall(1)
            .callsFake(entity => {
                entity.id = "B";
                return new QueryResult();
            })
            .onCall(2)
            .callsFake(entity => {
                entity.id = "A";
                return new QueryResult();
            });

        await user.save();
        save.restore();

        assert(save.calledThrice);
        assert.equal(user.id, "A");

        const company = await user.company;
        assert.equal(company.id, "B");
        assert.equal((await company.image).id, "C");
    });

    it("should not trigger save on linked entity since it was not loaded", async () => {
        const findById = sandbox
            .stub(One.getDriver(), "findOne")
            .onCall(0)
            .callsFake(() => {
                return new QueryResult({ id: "one", name: "One", two: "two" });
            });

        const one = await One.findById("one");
        findById.restore();

        const save = sandbox
            .stub(one.getDriver(), "save")
            .onCall(0)
            .callsFake(() => {
                return new QueryResult();
            });

        await one.save();
        save.restore();

        assert(save.calledOnce);
    });

    it("should create new entity and save links correctly", async () => {
        const findById = sandbox
            .stub(One.getDriver(), "findOne")
            .onCall(0)
            .callsFake(() => {
                return new QueryResult({ id: "one", name: "One" });
            });

        const one = await One.findById("one");
        findById.restore();

        one.two = { name: "two", three: { name: "three" } };

        const save = sandbox
            .stub(one.getDriver(), "save")
            .onCall(0)
            .callsFake(entity => {
                entity.id = "three";
                return new QueryResult();
            })
            .onCall(1)
            .callsFake(entity => {
                entity.id = "two";
                return new QueryResult();
            })
            .onCall(2)
            .callsFake(() => {
                return new QueryResult();
            });

        await one.save();
        save.restore();

        assert(save.calledThrice);

        assert.equal(one.id, "one");

        const two = await one.two;
        assert.equal(two.id, "two");

        const three = await two.three;
        assert.equal(three.id, "three");

        assert.equal(await one.getAttribute("two").getStorageValue(), "two");
        assert.equal(await two.getAttribute("three").getStorageValue(), "three");
    });

    it("should delete existing entity once new one was assigned and main entity saved", async () => {
        let entityFindById = sandbox
            .stub(One.getDriver(), "findOne")
            .onCall(0)
            .callsFake(() => {
                return new QueryResult({ id: "one", name: "One", two: "two" });
            })
            .onCall(1)
            .callsFake(() => {
                return new QueryResult({ id: "two", name: "Two", three: "three" });
            });

        const one = await One.findById("a");
        assert.equal(await one.getAttribute("two").getStorageValue(), "two");
        assert.equal(one.getAttribute("two").value.getCurrent(), "two");

        one.two = {
            name: "Another Two",
            three: {
                name: "Another Three",
                four: { name: "Another Four" },
                anotherFour: { name: "Another Four x2" }
            }
        };

        // Since set is async, to test initial / current values, we had to get value of attribute two...
        await one.two;

        assert.equal(entityFindById.callCount, 2);
        entityFindById.restore();

        // ... and now we can be sure the values are set and ready for testing.
        assert.equal(one.getAttribute("two").value.getInitial().id, "two");
        assert.equal(one.getAttribute("two").value.getCurrent().id, null);

        // This is what will happen once we execute save method on One entity

        // 1. recursively call save method on all child entities.
        let entitySave = sandbox
            .stub(One.getDriver(), "save")
            .onCall(0)
            .callsFake(entity => {
                entity.id = "anotherFour";
                return new QueryResult();
            })
            .onCall(1)
            .callsFake(entity => {
                entity.id = "anotherFourFour";
                return new QueryResult();
            })
            .onCall(2)
            .callsFake(entity => {
                entity.id = "anotherThree";
                return new QueryResult();
            })
            .onCall(3)
            .callsFake(entity => {
                entity.id = "anotherTwo";
                return new QueryResult();
            })
            .onCall(4)
            .callsFake(() => {
                return new QueryResult();
            });

        // 2. Once the save is done, deletes will start because main entity has a different entity on attribute 'two'. Before deletions,
        // findById method will be executed to recursively load entities and then of course delete them. At this point, we only need
        // to load entity 'three' on initial entity 'two'. After that, deletes will start, it will delete entity three and entity two.
        entityFindById = sandbox
            .stub(One.getDriver(), "findOne")
            .onCall(0)
            .callsFake(() => {
                return new QueryResult({ id: "three", name: "Three" });
            });

        let entityDelete = sandbox.stub(One.getDriver(), "delete").callsFake(() => {
            new QueryResult();
        });

        await one.save();

        assert.equal(entitySave.callCount, 5);
        assert.equal(entityFindById.callCount, 1);
        assert.equal(entityDelete.callCount, 2);

        entityFindById.restore();
        entityDelete.restore();
        entitySave.restore();
    });

    it("must delete previous entities even if they were still loading", () => {});
});
