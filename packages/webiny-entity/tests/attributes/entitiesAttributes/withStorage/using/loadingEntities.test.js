import { QueryResult } from "../../../../../src/index";
import sinon from "sinon";
import { Group, User, UsersGroups } from "../../../../entities/entitiesUsingWithStorage";

const sandbox = sinon.sandbox.create();

describe("save and delete entities attribute test", () => {
    afterEach(() => sandbox.restore());
    beforeEach(() => User.getEntityPool().flush());

    test("should use correct storage queries to fetch linked entities", async () => {
        let entityFindById = sandbox
            .stub(User.getDriver(), "findOne")
            .callsFake(() => new QueryResult({ id: "A", groups: ["1st", "2nd", "3rd"] }));

        const user = await User.findById(123);
        entityFindById.restore();

        const findStub = sandbox
            .stub(UsersGroups.getDriver(), "findOne")
            .onCall(0)
            .callsFake(() => {
                return new QueryResult({ id: "1st", user: "A", group: "X" });
            })

            .onCall(1)
            .callsFake(() => {
                return new QueryResult({ id: "2nd", user: "A", group: "Y" });
            })
            .onCall(2)
            .callsFake(() => {
                return new QueryResult({ id: "3rd", user: "A", group: "Z" });
            })
            .onCall(3)
            .callsFake(() => {
                return new QueryResult({ id: "X", name: "Group X" });
            })
            .onCall(4)
            .callsFake(() => {
                return new QueryResult({ id: "Y", name: "Group Y" });
            })
            .onCall(5)
            .callsFake(() => {
                return new QueryResult({ id: "Z", name: "Group Z" });
            });

        await user.groups;

        expect(findStub.getCall(0).args[0]).toEqual(UsersGroups);
        expect(findStub.getCall(0).args[1]).toEqual({
            query: {
                id: "1st"
            }
        });

        expect(findStub.getCall(1).args[0]).toEqual(UsersGroups);
        expect(findStub.getCall(1).args[1]).toEqual({
            query: {
                id: "2nd"
            }
        });

        expect(findStub.getCall(2).args[0]).toEqual(UsersGroups);
        expect(findStub.getCall(2).args[1]).toEqual({
            query: {
                id: "3rd"
            }
        });

        expect(findStub.getCall(3).args[0]).toEqual(Group);
        expect(findStub.getCall(3).args[1]).toEqual({
            query: {
                id: "X"
            }
        });
        expect(findStub.getCall(4).args[0]).toEqual(Group);
        expect(findStub.getCall(4).args[1]).toEqual({
            query: {
                id: "Y"
            }
        });

        expect(findStub.getCall(5).args[0]).toEqual(Group);
        expect(findStub.getCall(5).args[1]).toEqual({
            query: {
                id: "Z"
            }
        });

        findStub.restore();
    });

    test("should wait until entities are loaded if loading is in progress", async () => {
        let entityFindById = sandbox
            .stub(User.getDriver(), "findOne")
            .callsFake(() => new QueryResult({ id: "A" }));
        const user = await User.findById(123);
        entityFindById.restore();

        sandbox.stub(UsersGroups.getDriver(), "find").callsFake(() => {
            return new QueryResult([
                { id: "1st", user: "A", group: "X" },
                { id: "2nd", user: "A", group: "Y" },
                { id: "3rd", user: "A", group: "Z" }
            ]);
        });

        sandbox
            .stub(Group.getDriver(), "findOne")
            .onCall(0)
            .callsFake(() => {
                return new QueryResult({ id: "X", name: "Group X" });
            })
            .onCall(1)
            .callsFake(() => {
                return new QueryResult({ id: "Y", name: "Group Y" });
            })
            .onCall(2)
            .callsFake(() => {
                return new QueryResult({ id: "Z", name: "Group Z" });
            });

        await user.set("groups", [{ name: "Group P" }, { name: "Group Q" }]);
        expect(user.getAttribute("groups").value.state).toEqual({
            loading: false,
            loaded: false
        });

        let entitySave = sandbox
            .stub(user.getDriver(), "save")
            .onCall(0)
            .callsFake(() => {
                return new QueryResult();
            })
            .onCall(1)
            .callsFake(entity => {
                entity.id = "P";
                return new QueryResult();
            })
            .onCall(2)
            .callsFake(entity => {
                entity.id = "4th";
                return new QueryResult();
            })
            .onCall(3)
            .callsFake(entity => {
                entity.id = "Q";
                return new QueryResult();
            })
            .onCall(4)
            .callsFake(entity => {
                entity.id = "5th";
                return new QueryResult();
            });

        await user.save();

        entitySave.restore();

        expect(entitySave.callCount).toBe(5);

        expect(user.getAttribute("groups").value.initial).toHaveLength(2);
        expect(user.getAttribute("groups").value.initial[0].id).toBe("P");
        expect(user.getAttribute("groups").value.initial[1].id).toBe("Q");
        expect(user.getAttribute("groups").value.current).toHaveLength(2);
        expect(user.getAttribute("groups").value.current[0].id).toBe("P");
        expect(user.getAttribute("groups").value.current[1].id).toBe("Q");

        expect(user.getAttribute("groups").value.links.initial).toHaveLength(2);
        expect(user.getAttribute("groups").value.links.initial[0].id).toBe("4th");
        expect(user.getAttribute("groups").value.links.initial[1].id).toBe("5th");

        expect(user.getAttribute("groups").value.links.current).toHaveLength(2);
        expect(user.getAttribute("groups").value.links.current[0].id).toBe("4th");
        expect(user.getAttribute("groups").value.links.current[1].id).toBe("5th");
    });
});
