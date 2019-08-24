import { User, Group, UsersGroups } from "../../../../entities/entitiesUsing";
import sinon from "sinon";
import { QueryResult } from "@webiny/entity";
import { MainEntity } from "../../../../entities/entitiesAttributeEntities";

const sandbox = sinon.sandbox.create();

describe("attribute entities (using an additional aggregation class) - loading test", () => {
    afterEach(() => sandbox.restore());
    beforeEach(() => MainEntity.getEntityPool().flush());

    test("should correctly set entity and link (class and attributes)", async () => {
        const user = new User();
        const classes = user.getAttribute("groups").classes;
        expect(classes).toEqual({
            entities: {
                attribute: "user",
                class: Group
            },
            parent: "User",
            using: {
                attribute: "group",
                class: UsersGroups
            }
        });
    });

    test("should load links and entities correctly", async () => {
        let entityFindById = sandbox
            .stub(User.getDriver(), "findOne")
            .callsFake(() => new QueryResult({ id: "A" }));
        const user = await User.findById(123);
        entityFindById.restore();

        expect(user.getAttribute("groups").value.initial).toHaveLength(0);
        expect(user.getAttribute("groups").value.current).toHaveLength(0);

        const entityFind = sandbox.stub(UsersGroups.getDriver(), "find").callsFake(() => {
            return new QueryResult([
                { id: "1st", user: "A", group: "X" },
                { id: "2nd", user: "A", group: "Y" },
                { id: "3rd", user: "A", group: "Z" }
            ]);
        });

        entityFindById = sandbox
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

        const groups = await user.get("groups");

        expect(entityFind.callCount).toEqual(1);
        expect(entityFindById.callCount).toEqual(3);

        expect(user.getAttribute("groups").value.initial).toHaveLength(3);
        expect(user.getAttribute("groups").value.initial[0].id).toEqual("X");
        expect(user.getAttribute("groups").value.initial[1].id).toEqual("Y");
        expect(user.getAttribute("groups").value.initial[2].id).toEqual("Z");
        expect(user.getAttribute("groups").value.current).toHaveLength(3);

        expect(groups[0].id).toEqual("X");
        expect(groups[1].id).toEqual("Y");
        expect(groups[2].id).toEqual("Z");

        expect(user.getAttribute("groups").value.links.initial).toHaveLength(3);
        expect(user.getAttribute("groups").value.links.initial[0].id).toEqual("1st");
        expect(user.getAttribute("groups").value.links.initial[1].id).toEqual("2nd");
        expect(user.getAttribute("groups").value.links.initial[2].id).toEqual("3rd");

        expect(user.getAttribute("groups").value.links.current[0].id).toEqual("1st");
        expect(user.getAttribute("groups").value.links.current[1].id).toEqual("2nd");
        expect(user.getAttribute("groups").value.links.current[2].id).toEqual("3rd");

        entityFind.restore();
    });

    test("should not load if values are already set", async () => {
        const user = new User();
        const entitySave = sandbox.spy(UsersGroups.getDriver(), "save");
        const entityFind = sandbox.spy(UsersGroups.getDriver(), "find");
        const entityFindById = sandbox.spy(UsersGroups.getDriver(), "findOne");

        await user.groups;

        expect(entitySave.callCount).toEqual(0);
        expect(entityFind.callCount).toEqual(0);
        expect(entityFindById.callCount).toEqual(0);

        await user.save();
        expect(entitySave.callCount).toEqual(0);
        expect(entityFind.callCount).toEqual(0);
        expect(entityFindById.callCount).toEqual(0);

        await user.save();
        expect(entitySave.callCount).toEqual(0);
        expect(entityFind.callCount).toEqual(0);
        expect(entityFindById.callCount).toEqual(0);

        await user.save();
        expect(entitySave.callCount).toEqual(0);
        expect(entityFind.callCount).toEqual(0);
        expect(entityFindById.callCount).toEqual(0);

        await user.groups;
        await user.save();

        expect(entitySave.callCount).toEqual(0);
        expect(entityFind.callCount).toEqual(0);
        expect(entityFindById.callCount).toEqual(0);

        const user2 = new User();

        await user2.save();
        expect(entitySave.callCount).toEqual(0);
        expect(entityFind.callCount).toEqual(0);
        expect(entityFindById.callCount).toEqual(0);

        await user2.save();
        expect(entitySave.callCount).toEqual(0);
        expect(entityFind.callCount).toEqual(0);
        expect(entityFindById.callCount).toEqual(0);

        await user2.groups;
        await user2.save();

        expect(entitySave.callCount).toEqual(0);
        expect(entityFind.callCount).toEqual(1);
        expect(entityFindById.callCount).toEqual(0);

        // 'firstName' attribute doesn't exist, so save shouldn't still do anything - entity is still clean.
        user2.firstName = "test";
        await user2.save();

        await user2.groups;

        expect(entitySave.callCount).toEqual(0);
        expect(entityFind.callCount).toEqual(1);
        expect(entityFindById.callCount).toEqual(0);

        const user3 = new User();
        user3.name = "test";
        await user3.save();

        await user3.groups;

        expect(entitySave.callCount).toEqual(1);
        expect(entityFind.callCount).toEqual(2);
        expect(entityFindById.callCount).toEqual(0);

        entitySave.restore();
        entityFind.restore();
        entityFindById.restore();
    });
});
