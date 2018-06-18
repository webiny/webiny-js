import User from "./entities/user";
import { QueryResult } from "./..";
import { expect } from "chai";
import sinon from "sinon";

const sandbox = sinon.sandbox.create();

describe("entity pool test", () => {
    beforeEach(() => User.getEntityPool().flush());
    afterEach(() => sandbox.restore());

    test("after save, entity should be present in the pool and after delete it must be removed", async () => {
        const user = new User();
        user.age = 30;
        sandbox.stub(user.getDriver(), "save").callsFake(entity => {
            entity.id = "A";
            return new QueryResult();
        });

        expect(User.getEntityPool().has(user)).to.equal(false);
        expect(User.getEntityPool().get(user)).to.equal(undefined);
        await user.save();
        expect(User.getEntityPool().get(user)).to.be.instanceOf(User);
        expect(User.getEntityPool().has(user)).to.equal(true);

        sandbox.stub(user.getDriver(), "delete").callsFake(() => new QueryResult());
        await user.delete();

        expect(User.getEntityPool().has(user)).to.equal(false);
        expect(User.getEntityPool().get(user)).to.equal(undefined);
    });

    test("has and get methods should return true / false correctly (whether is called with a entity class or an instance)", async () => {
        const user = new User();
        user.age = 30;
        sandbox.stub(user.getDriver(), "save").callsFake(entity => {
            entity.id = "A";
            return new QueryResult();
        });

        expect(User.getEntityPool().has(user)).to.equal(false);
        expect(User.getEntityPool().has(User, "A")).to.equal(false);
        await user.save();
        expect(User.getEntityPool().has(user)).to.equal(true);
        expect(User.getEntityPool().has(User, "A")).to.equal(true);
    });

    test("findById must add to the pool and consequent findById calls must utilize it", async () => {
        const entityFindById = sandbox.stub(User.getDriver(), "findOne").callsFake(() => {
            return new QueryResult({ id: "A" });
        });

        expect(User.getEntityPool().has(User, "A")).to.equal(false);
        const user1 = await User.findById("A");
        expect(User.getEntityPool().has(User, "A")).to.equal(true);
        expect(entityFindById.callCount).to.equal(1);

        const user2 = await User.findById("A");
        expect(entityFindById.callCount).to.equal(1);

        expect(user1).to.deep.equal(user2);
    });

    test("find must add to the pool and consequent finds must utilize it", async () => {
        const entityFind = sandbox.stub(User.getDriver(), "find").callsFake(() => {
            return new QueryResult([{ id: "A" }, { id: "B" }, { id: "C" }]);
        });

        expect(User.getEntityPool().has(User, "A")).to.equal(false);
        expect(User.getEntityPool().has(User, "B")).to.equal(false);
        expect(User.getEntityPool().has(User, "C")).to.equal(false);
        const users1 = await User.find({});
        expect(User.getEntityPool().has(User, "A")).to.equal(true);
        expect(User.getEntityPool().has(User, "B")).to.equal(true);
        expect(User.getEntityPool().has(User, "C")).to.equal(true);

        expect(entityFind.callCount).to.equal(1);
        const users2 = await User.find({});
        expect(entityFind.callCount).to.equal(2);

        expect(users1).to.deep.equal(users2);
    });

    test("findByIds must add to the pool and consequent finds must utilize it", async () => {
        let entityFindByIds = sandbox
            .stub(User.getDriver(), "findOne")
            .onCall(0)
            .callsFake(() => {
                return new QueryResult({ id: "A" });
            })
            .onCall(1)
            .callsFake(() => {
                return new QueryResult({ id: "B" });
            })
            .onCall(2)
            .callsFake(() => {
                return new QueryResult({ id: "C" });
            });

        expect(User.getEntityPool().has(User, "A")).to.equal(false);
        expect(User.getEntityPool().has(User, "B")).to.equal(false);
        expect(User.getEntityPool().has(User, "C")).to.equal(false);
        await User.findByIds(["A", "B", "C"]);
        expect(User.getEntityPool().has(User, "A")).to.equal(true);
        expect(User.getEntityPool().has(User, "B")).to.equal(true);
        expect(User.getEntityPool().has(User, "C")).to.equal(true);
        expect(entityFindByIds.callCount).to.equal(3);

        entityFindByIds.restore();

        entityFindByIds = sandbox
            .stub(User.getDriver(), "findOne")
            .onCall(0)
            .callsFake(() => new QueryResult({ id: "D" }))
            .onCall(1)
            .callsFake(() => new QueryResult({ id: "E" }));

        expect(User.getEntityPool().has(User, "D")).to.equal(false);
        expect(User.getEntityPool().has(User, "E")).to.equal(false);
        await User.findByIds(["A", "B", "C", "D", "E"]);
        entityFindByIds.restore();
        expect(User.getEntityPool().has(User, "A")).to.equal(true);
        expect(User.getEntityPool().has(User, "B")).to.equal(true);
        expect(User.getEntityPool().has(User, "C")).to.equal(true);
        expect(User.getEntityPool().has(User, "D")).to.equal(true);
        expect(User.getEntityPool().has(User, "E")).to.equal(true);

        entityFindByIds = sandbox
            .stub(User.getDriver(), "find")
            .callsFake(
                () =>
                    new QueryResult([
                        { id: "A" },
                        { id: "B" },
                        { id: "C" },
                        { id: "D" },
                        { id: "E" }
                    ])
            );

        // No calls to the storage must be made.
        await User.findByIds(["A", "B", "C", "D", "E"]);
        entityFindByIds.restore();

        expect(entityFindByIds.callCount).to.equal(0);
    });

    test("remove method must exist if class was not inserted before", async () => {
        expect(User.getEntityPool().pool).to.be.empty;
        User.getEntityPool().remove(new User());
        expect(User.getEntityPool().pool).to.be.empty;
    });

    test("flush method must empty the pool", async () => {
        sandbox
            .stub(User.getDriver(), "findOne")
            .onCall(0)
            .callsFake(() => {
                return new QueryResult({ id: "A" });
            })
            .onCall(1)
            .callsFake(() => {
                return new QueryResult({ id: "B" });
            })
            .onCall(2)
            .callsFake(() => {
                return new QueryResult({ id: "C" });
            });

        await User.findByIds(["A", "B", "C"]);
        expect(User.getEntityPool().has(User, "A")).to.equal(true);
        expect(User.getEntityPool().has(User, "B")).to.equal(true);
        expect(User.getEntityPool().has(User, "C")).to.equal(true);

        User.getEntityPool().flush();
        expect(User.getEntityPool().pool).to.be.empty;
    });

    test("findOne must return from pool if possible", async () => {
        const entityFindOne = sandbox.stub(User.getDriver(), "findOne").callsFake(() => {
            return new QueryResult({ id: "A" });
        });

        expect(User.getEntityPool().has(User, "A")).to.equal(false);
        const foundUser = await User.findOne({});
        expect(User.getEntityPool().has(User, "A")).to.equal(true);
        expect(entityFindOne.callCount).to.equal(1);

        const againFoundUser = await User.findOne({});
        expect(entityFindOne.callCount).to.equal(2);
        expect(foundUser).to.equal(againFoundUser);
    });
});
