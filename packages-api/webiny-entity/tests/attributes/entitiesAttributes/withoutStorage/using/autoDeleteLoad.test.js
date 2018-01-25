import { User, Group, UsersGroups } from "../../../../entities/entitiesUsing";
import { expect } from "chai";
import sinon from "sinon";
import { QueryResult } from "../../../../../src";

const sandbox = sinon.sandbox.create();

describe("attribute entities (using an additional aggregation class) - loading test", function() {
    afterEach(() => sandbox.restore());

    it("should correctly set entity and link (class and attributes)", async () => {
        const user = new User();
        const classes = user.getAttribute("groups").classes;
        expect(classes).to.deep.equal({
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

    it("should load links and entities correctly", async () => {
        let entityFindById = sandbox
            .stub(User.getDriver(), "findById")
            .callsFake(() => new QueryResult({ id: "A" }));
        const user = await User.findById(123);
        entityFindById.restore();

        expect(user.getAttribute("groups").value.initial).to.have.lengthOf(0);
        expect(user.getAttribute("groups").value.current).to.have.lengthOf(0);

        const entityFind = sandbox.stub(UsersGroups.getDriver(), "find").callsFake(() => {
            return new QueryResult([
                { id: "1st", user: "A", group: "X" },
                { id: "2nd", user: "A", group: "Y" },
                { id: "3rd", user: "A", group: "Z" }
            ]);
        });

        entityFindById = sandbox
            .stub(Group.getDriver(), "findById")
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

        const groups = await user.groups;

        expect(entityFind.callCount).to.equal(1);
        expect(entityFindById.callCount).to.equal(3);

        expect(user.getAttribute("groups").value.initial).to.have.lengthOf(3);
        expect(user.getAttribute("groups").value.initial[0].id).to.equal("X");
        expect(user.getAttribute("groups").value.initial[1].id).to.equal("Y");
        expect(user.getAttribute("groups").value.initial[2].id).to.equal("Z");
        expect(user.getAttribute("groups").value.current).to.have.lengthOf(3);

        expect(groups[0].id).to.equal("X");
        expect(groups[1].id).to.equal("Y");
        expect(groups[2].id).to.equal("Z");

        expect(user.getAttribute("groups").value.links.initial).to.have.lengthOf(3);
        expect(user.getAttribute("groups").value.links.initial[0].id).to.equal("1st");
        expect(user.getAttribute("groups").value.links.initial[1].id).to.equal("2nd");
        expect(user.getAttribute("groups").value.links.initial[2].id).to.equal("3rd");

        expect(user.getAttribute("groups").value.links.current[0].id).to.equal("1st");
        expect(user.getAttribute("groups").value.links.current[1].id).to.equal("2nd");
        expect(user.getAttribute("groups").value.links.current[2].id).to.equal("3rd");

        entityFind.restore();
    });

    it("should not load if values are already set", async () => {
        const user = new User();
        const entitySave = sandbox.spy(UsersGroups.getDriver(), "save");
        const entityFind = sandbox.spy(UsersGroups.getDriver(), "find");
        const entityFindById = sandbox.spy(UsersGroups.getDriver(), "findById");

        await user.groups;

        expect(entitySave.callCount).to.equal(0);
        expect(entityFind.callCount).to.equal(0);
        expect(entityFindById.callCount).to.equal(0);

        await user.save();
        expect(entitySave.callCount).to.equal(1);
        expect(entityFind.callCount).to.equal(0);
        expect(entityFindById.callCount).to.equal(0);

        await user.save();
        expect(entitySave.callCount).to.equal(2);
        expect(entityFind.callCount).to.equal(0);
        expect(entityFindById.callCount).to.equal(0);

        await user.save();
        expect(entitySave.callCount).to.equal(3);
        expect(entityFind.callCount).to.equal(0);
        expect(entityFindById.callCount).to.equal(0);

        await user.groups;
        await user.save();

        expect(entitySave.callCount).to.equal(4);
        expect(entityFind.callCount).to.equal(0);
        expect(entityFindById.callCount).to.equal(0);

        const user2 = new User();

        await user2.save();
        expect(entitySave.callCount).to.equal(5);
        expect(entityFind.callCount).to.equal(0);
        expect(entityFindById.callCount).to.equal(0);

        await user2.save();
        expect(entitySave.callCount).to.equal(6);
        expect(entityFind.callCount).to.equal(0);
        expect(entityFindById.callCount).to.equal(0);

        await user2.groups;
        await user2.save();

        expect(entitySave.callCount).to.equal(7);
        expect(entityFind.callCount).to.equal(1);
        expect(entityFindById.callCount).to.equal(0);

        entitySave.restore();
        entityFind.restore();
        entityFindById.restore();
    });
});
