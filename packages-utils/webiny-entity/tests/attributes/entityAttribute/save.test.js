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

        entity.getAttribute("company").setStorageValue("one");
        assert.equal(await entity.getAttribute("company").getStorageValue(), "one");

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

        entity.company = { id: "five", name: "Test-1" };
        await entity.company;
        assert.equal(await entity.getAttribute("company").getStorageValue(), "five");

        entity.company = null;
        await entity.company;
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

        await user.get("company.image");

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
            });

        const one = await One.findById("a");
        assert.equal(await one.getAttribute("two").getStorageValue(), "two");
        assert.equal(one.getAttribute("two").value.getCurrent(), "two");
        assert.equal(one.getAttribute("two").value.getInitial(), "two");

        one.two = {
            name: "Another Two",
            three: {
                name: "Another Three",
                four: { name: "Another Four" },
                anotherFour: { name: "Another Four x2" }
            }
        };

        assert.equal(entityFindById.callCount, 1);
        entityFindById.restore();

        // ... and now we can be sure the values are set and ready for testing.
        assert.equal(one.getAttribute("two").value.getInitial(), "two");
        assert.equal(one.getAttribute("two").value.getCurrent().id, null);
        assert.deepEqual(one.getAttribute("two").value.state, { loaded: false, loading: false });

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

        // 2. Once the save is done, deletes will start because main entity has a different entity on attribute 'two'.
        // Before deletions, findById method will be executed to recursively load entities and then of course delete
        // them (first entity 'three' than 'two').
        entityFindById = sandbox
            .stub(One.getDriver(), "findOne")
            .onCall(0)
            .callsFake(() => {
                return new QueryResult({ id: "two", name: "Two", three: "three" });
            })
            .onCall(1)
            .callsFake(() => {
                return new QueryResult({ id: "three", name: "Three" });
            });

        let entityDelete = sandbox.stub(One.getDriver(), "delete").callsFake(() => {
            new QueryResult();
        });

        await one.save();

        assert.equal(entitySave.callCount, 5);
        assert.equal(entityFindById.callCount, 2);

        // Make sure entity with ID 'three' was first deleted, and then the one with ID 'two'.
        assert.equal(entityDelete.callCount, 2);
        assert.equal(entityDelete.getCall(0).args[0].id, "three");
        assert.equal(entityDelete.getCall(1).args[0].id, "two");

        assert.equal(one.getAttribute("two").value.getInitial().id, "anotherTwo");
        assert.equal(one.getAttribute("two").value.getCurrent().id, "anotherTwo");
        assert.deepEqual(one.getAttribute("two").value.state, { loaded: true, loading: false });

        entityFindById.restore();
        entityDelete.restore();
        entitySave.restore();
    });

    it("should load entities on save to make sure they exist", async () => {
        let entityFindById = sandbox
            .stub(One.getDriver(), "findOne")
            .onCall(0)
            .callsFake(() => {
                return new QueryResult({ id: "one", name: "One", two: "two" });
            });

        const one = await One.findById("a");

        assert.equal(entityFindById.callCount, 1);
        entityFindById.restore();

        one.two = "anotherTwo";

        entityFindById = sandbox
            .stub(One.getDriver(), "findOne")
            .onCall(0)
            .callsFake(() => {
                return new QueryResult({ id: "anotherTwo", name: "Two" });
            });

        let entitySave = sandbox.stub(One.getDriver(), "save").callsFake(() => new QueryResult());

        await one.save();

        assert.equal(entityFindById.callCount, 1);
        assert.equal(entitySave.callCount, 2);

        entityFindById.restore();
        entitySave.restore();
    });
});
