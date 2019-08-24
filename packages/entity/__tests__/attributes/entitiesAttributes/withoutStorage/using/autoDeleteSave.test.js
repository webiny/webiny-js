import { User, Group, UsersGroups } from "../../../../entities/entitiesUsing";
import { UserDynamic } from "../../../../entities/entitiesUsingDynamic";
import sinon from "sinon";
import { QueryResult } from "@webiny/entity";
import { MainEntity } from "../../../../entities/entitiesAttributeEntities";

const sandbox = sinon.sandbox.create();

describe("attribute entities (using an additional aggregation class) - saving test", () => {
    afterEach(() => sandbox.restore());
    beforeEach(() => MainEntity.getEntityPool().flush());

    test("should assign existing values correctly and track links that need to be deleted on consequent save method calls", async () => {
        let entityFindById = sandbox
            .stub(User.getDriver(), "findOne")
            .callsFake(() => new QueryResult({ id: "A" }));
        const user = await User.findById(123);
        entityFindById.restore();

        sandbox.stub(UsersGroups.getDriver(), "find").callsFake(() => {
            return new QueryResult([
                { id: "usersGroups1st", user: "A", group: "X" },
                { id: "usersGroups2nd", user: "A", group: "Y" },
                { id: "usersGroups3rd", user: "A", group: "Z" }
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

        user.groups = [{ name: "Group P" }, { name: "Group Q" }];

        expect(user.getAttribute("groups").value.initial).toHaveLength(0);
        expect(user.getAttribute("groups").value.current).toHaveLength(2);
        expect(user.getAttribute("groups").value.current[0].name).toEqual("Group P");
        expect(user.getAttribute("groups").value.current[1].name).toEqual("Group Q");

        expect(user.getAttribute("groups").value.links.initial).toHaveLength(0);
        expect(user.getAttribute("groups").value.links.current).toHaveLength(0);

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
                entity.id = "usersGroups4th";
                return new QueryResult();
            })
            .onCall(3)
            .callsFake(entity => {
                entity.id = "Q";
                return new QueryResult();
            })
            .onCall(4)
            .callsFake(entity => {
                entity.id = "usersGroups5th";
                return new QueryResult();
            });

        await user.save();

        entitySave.restore();

        expect(entitySave.callCount).toEqual(5);

        expect(user.getAttribute("groups").value.initial).toHaveLength(2);
        expect(user.getAttribute("groups").value.initial[0].id).toEqual("P");
        expect(user.getAttribute("groups").value.initial[1].id).toEqual("Q");
        expect(user.getAttribute("groups").value.current).toHaveLength(2);
        expect(user.getAttribute("groups").value.current[0].id).toEqual("P");
        expect(user.getAttribute("groups").value.current[1].id).toEqual("Q");

        expect(user.getAttribute("groups").value.links.initial).toHaveLength(2);
        expect(user.getAttribute("groups").value.links.initial[0].id).toEqual("usersGroups4th");
        expect(user.getAttribute("groups").value.links.initial[1].id).toEqual("usersGroups5th");

        expect(user.getAttribute("groups").value.links.current).toHaveLength(2);
        expect(user.getAttribute("groups").value.links.current[0].id).toEqual("usersGroups4th");
        expect(user.getAttribute("groups").value.links.current[1].id).toEqual("usersGroups5th");

        // Let's try to add values using push.
        const groups = await user.groups;

        groups.push(new Group().populate({ id: "I", name: "Group I" }));
        groups.push(new Group().populate({ name: "Group J" }));
        groups.push(new Group().populate({ id: "I", name: "Group I" }));

        user.groups = groups;

        // Here we care only for save calls that actually created an ID, we don't care about updates. We should have
        // four saves: link for 1st item, link and the item itself for 2nd, and again only link for the last item.
        entitySave = sandbox
            .stub(user.getDriver(), "save")
            .callsFake(() => new QueryResult())
            .onCall(4)
            .callsFake(entity => {
                entity.id = "usersGroups6th";
                return new QueryResult();
            })
            .onCall(5)
            .callsFake(entity => {
                entity.id = "J";
                return new QueryResult();
            })
            .onCall(6)
            .callsFake(entity => {
                entity.id = "usersGroups7th";
                return new QueryResult();
            })
            .onCall(8)
            .callsFake(entity => {
                entity.id = "usersGroups8th";
                return new QueryResult();
            });

        await user.save();
        entitySave.restore();

        expect(entitySave.callCount).toEqual(9);

        expect(user.getAttribute("groups").value.initial).toHaveLength(5);
        expect(user.getAttribute("groups").value.initial[0].id).toEqual("P");
        expect(user.getAttribute("groups").value.initial[1].id).toEqual("Q");
        expect(user.getAttribute("groups").value.initial[2].id).toEqual("I");
        expect(user.getAttribute("groups").value.initial[3].id).toEqual("J");
        expect(user.getAttribute("groups").value.initial[4].id).toEqual("I");
        expect(user.getAttribute("groups").value.current).toHaveLength(5);
        expect(user.getAttribute("groups").value.current[0].id).toEqual("P");
        expect(user.getAttribute("groups").value.current[1].id).toEqual("Q");
        expect(user.getAttribute("groups").value.current[2].id).toEqual("I");
        expect(user.getAttribute("groups").value.current[3].id).toEqual("J");
        expect(user.getAttribute("groups").value.current[4].id).toEqual("I");

        expect(user.getAttribute("groups").value.links.initial).toHaveLength(5);
        expect(user.getAttribute("groups").value.links.initial[0].id).toEqual("usersGroups4th");
        expect(user.getAttribute("groups").value.links.initial[1].id).toEqual("usersGroups5th");
        expect(user.getAttribute("groups").value.links.initial[2].id).toEqual("usersGroups6th");
        expect(user.getAttribute("groups").value.links.initial[3].id).toEqual("usersGroups7th");
        expect(user.getAttribute("groups").value.links.initial[4].id).toEqual("usersGroups8th");

        expect(user.getAttribute("groups").value.links.current).toHaveLength(5);
        expect(user.getAttribute("groups").value.links.current[0].id).toEqual("usersGroups4th");
        expect(user.getAttribute("groups").value.links.current[1].id).toEqual("usersGroups5th");
        expect(user.getAttribute("groups").value.links.current[2].id).toEqual("usersGroups6th");
        expect(user.getAttribute("groups").value.links.current[3].id).toEqual("usersGroups7th");
        expect(user.getAttribute("groups").value.links.current[4].id).toEqual("usersGroups8th");

        // Let's try to remove values using shift / pop - deletes should occur.
        groups.pop();
        groups.shift();

        user.groups = groups;

        const entityDelete = sandbox.spy(user.getDriver(), "delete");
        entitySave = sandbox.stub(user.getDriver(), "save");
        await user.save();

        expect(entitySave.callCount).toEqual(4);
        expect(entityDelete.callCount).toEqual(2);

        entitySave.restore();
        entityDelete.restore();

        expect(user.getAttribute("groups").value.initial).toHaveLength(3);
        expect(user.getAttribute("groups").value.initial[0].id).toEqual("Q");
        expect(user.getAttribute("groups").value.initial[1].id).toEqual("I");
        expect(user.getAttribute("groups").value.initial[2].id).toEqual("J");
        expect(user.getAttribute("groups").value.current).toHaveLength(3);
        expect(user.getAttribute("groups").value.current[0].id).toEqual("Q");
        expect(user.getAttribute("groups").value.current[1].id).toEqual("I");
        expect(user.getAttribute("groups").value.current[2].id).toEqual("J");

        expect(user.getAttribute("groups").value.links.initial).toHaveLength(3);
        expect(user.getAttribute("groups").value.links.initial[0].id).toEqual("usersGroups5th");
        expect(user.getAttribute("groups").value.links.initial[1].id).toEqual("usersGroups6th");
        expect(user.getAttribute("groups").value.links.initial[2].id).toEqual("usersGroups7th");

        expect(user.getAttribute("groups").value.links.current).toHaveLength(3);
        expect(user.getAttribute("groups").value.links.current[0].id).toEqual("usersGroups5th");
        expect(user.getAttribute("groups").value.links.current[1].id).toEqual("usersGroups6th");
        expect(user.getAttribute("groups").value.links.current[2].id).toEqual("usersGroups7th");
    });

    test("must not recreate links", async () => {
        let entityFindById = sandbox
            .stub(User.getDriver(), "findOne")
            .callsFake(() => new QueryResult({ id: "A" }));

        const user = await User.findById(123);
        entityFindById.restore();

        // Let's try to populate with the same date as in DB.
        user.populate({
            groups: [
                { id: "X", name: "Group X" },
                { id: "Y", name: "Group Y" },
                { id: "Z", name: "Group Z" },
                { id: "newOne", name: "Group NewOne" }
            ]
        });

        expect(user.getAttribute("groups").value.dirty).toEqual(true);

        let entitySaveSpy = sandbox.spy(User.getDriver(), "save");
        let entityDeleteSpy = sandbox.spy(User.getDriver(), "delete");

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
            })
            .onCall(3)
            .callsFake(() => {
                return new QueryResult({ id: "newOne", name: "Group NewOne" });
            });

        sandbox.stub(UsersGroups.getDriver(), "find").callsFake(() => {
            return new QueryResult([
                { id: "usersGroups1st", user: "A", group: "X" },
                { id: "usersGroups2nd", user: "A", group: "Y" },
                { id: "usersGroups3rd", user: "A", group: "Z" }
            ]);
        });

        await user.save();

        expect(entitySaveSpy.callCount).toEqual(2);
        expect(entityDeleteSpy.callCount).toEqual(0);
    });

    test("should not save/delete dynamic attributes", async () => {
        let entityFindById = sandbox
            .stub(UserDynamic.getDriver(), "findOne")
            .callsFake(() => new QueryResult({ id: "A" }));

        const user = await UserDynamic.findById(123);
        entityFindById.restore();

        let entitySave = sandbox
            .stub(user.getDriver(), "save")
            .onCall(0)
            .callsFake(() => {
                return new QueryResult();
            })
            .onCall(1)
            .callsFake(() => {
                return new QueryResult();
            });
        await user.save();
        expect(entitySave.callCount).toEqual(0);

        user.name = "now it should save because of this dirty attribute";
        await user.save();
        entitySave.restore();
        expect(entitySave.callCount).toEqual(1);

        let entityDelete = sandbox
            .stub(user.getDriver(), "delete")
            .onCall(0)
            .callsFake(() => {
                return new QueryResult();
            })
            .onCall(1)
            .callsFake(() => {
                return new QueryResult();
            });

        await user.delete();
        entityDelete.restore();
        expect(entityDelete.callCount).toEqual(1);
    });
});
