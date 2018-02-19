import { User, Group, UsersGroups } from "../../../../entities/entitiesUsing";
import { expect } from "chai";
import sinon from "sinon";
import { QueryResult } from "../../../../../lib";

const sandbox = sinon.sandbox.create();

describe("attribute entities (using an additional aggregation class) - saving test", function() {
    afterEach(() => sandbox.restore());

    it("should assign existing values correctly and track links that need to be deleted on consequent save method calls", async () => {
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

        expect(user.getAttribute("groups").value.initial).to.have.lengthOf(3);
        expect(user.getAttribute("groups").value.initial[0].id).to.equal("X");
        expect(user.getAttribute("groups").value.initial[1].id).to.equal("Y");
        expect(user.getAttribute("groups").value.initial[2].id).to.equal("Z");
        expect(user.getAttribute("groups").value.current).to.have.lengthOf(2);
        expect(user.getAttribute("groups").value.current[0].name).to.equal("Group P");
        expect(user.getAttribute("groups").value.current[1].name).to.equal("Group Q");

        expect(user.getAttribute("groups").value.links.initial).to.have.lengthOf(3);
        expect(user.getAttribute("groups").value.links.initial[0].id).to.equal("1st");
        expect(user.getAttribute("groups").value.links.initial[1].id).to.equal("2nd");
        expect(user.getAttribute("groups").value.links.initial[2].id).to.equal("3rd");

        expect(user.getAttribute("groups").value.links.current).to.have.lengthOf(3);
        expect(user.getAttribute("groups").value.links.current[0].id).to.equal("1st");
        expect(user.getAttribute("groups").value.links.current[1].id).to.equal("2nd");
        expect(user.getAttribute("groups").value.links.current[2].id).to.equal("3rd");

        let entitySave = sandbox
            .stub(user.getDriver(), "save")
            .onCall(0)
            .callsFake(entity => {
                entity.id = "P";
                return new QueryResult();
            })
            .onCall(1)
            .callsFake(entity => {
                entity.id = "4th";
                return new QueryResult();
            })
            .onCall(2)
            .callsFake(entity => {
                entity.id = "Q";
                return new QueryResult();
            })
            .onCall(3)
            .callsFake(entity => {
                entity.id = "5th";
                return new QueryResult();
            })
            .onCall(4)
            .callsFake(() => {
                return new QueryResult();
            });

        await user.save();

        entitySave.restore();

        expect(entitySave.callCount).to.equal(5);

        expect(user.getAttribute("groups").value.initial).to.have.lengthOf(2);
        expect(user.getAttribute("groups").value.initial[0].id).to.equal("P");
        expect(user.getAttribute("groups").value.initial[1].id).to.equal("Q");
        expect(user.getAttribute("groups").value.current).to.have.lengthOf(2);
        expect(user.getAttribute("groups").value.current[0].id).to.equal("P");
        expect(user.getAttribute("groups").value.current[1].id).to.equal("Q");

        expect(user.getAttribute("groups").value.links.initial).to.have.lengthOf(2);
        expect(user.getAttribute("groups").value.links.initial[0].id).to.equal("4th");
        expect(user.getAttribute("groups").value.links.initial[1].id).to.equal("5th");

        expect(user.getAttribute("groups").value.links.current).to.have.lengthOf(2);
        expect(user.getAttribute("groups").value.links.current[0].id).to.equal("4th");
        expect(user.getAttribute("groups").value.links.current[1].id).to.equal("5th");

        // Let's try to add values using push.
        const groups = await user.groups;

        groups.push(new Group().populate({ id: "I", name: "Group I" }));
        groups.push(new Group().populate({ name: "Group J" }));
        groups.push(new Group().populate({ id: "I", name: "Group I" }));

        entitySave = sandbox
            .stub(user.getDriver(), "save")
            .callsFake(() => new QueryResult())
            .onCall(5)
            .callsFake(entity => {
                entity.id = "6th";
                return new QueryResult();
            })
            .onCall(6)
            .callsFake(entity => {
                entity.id = "J";
                return new QueryResult();
            })
            .onCall(7)
            .callsFake(entity => {
                entity.id = "7th";
                return new QueryResult();
            })
            .onCall(9)
            .callsFake(entity => {
                entity.id = "8th";
                return new QueryResult();
            });

        await user.save();
        entitySave.restore();

        expect(entitySave.callCount).to.equal(11);

        expect(user.getAttribute("groups").value.initial).to.have.lengthOf(5);
        expect(user.getAttribute("groups").value.initial[0].id).to.equal("P");
        expect(user.getAttribute("groups").value.initial[1].id).to.equal("Q");
        expect(user.getAttribute("groups").value.initial[2].id).to.equal("I");
        expect(user.getAttribute("groups").value.initial[3].id).to.equal("J");
        expect(user.getAttribute("groups").value.initial[4].id).to.equal("I");
        expect(user.getAttribute("groups").value.current).to.have.lengthOf(5);
        expect(user.getAttribute("groups").value.current[0].id).to.equal("P");
        expect(user.getAttribute("groups").value.current[1].id).to.equal("Q");
        expect(user.getAttribute("groups").value.current[2].id).to.equal("I");
        expect(user.getAttribute("groups").value.current[3].id).to.equal("J");
        expect(user.getAttribute("groups").value.current[4].id).to.equal("I");

        expect(user.getAttribute("groups").value.links.initial).to.have.lengthOf(5);
        expect(user.getAttribute("groups").value.links.initial[0].id).to.equal("4th");
        expect(user.getAttribute("groups").value.links.initial[1].id).to.equal("5th");
        expect(user.getAttribute("groups").value.links.initial[2].id).to.equal("6th");
        expect(user.getAttribute("groups").value.links.initial[3].id).to.equal("7th");
        expect(user.getAttribute("groups").value.links.initial[4].id).to.equal("8th");

        expect(user.getAttribute("groups").value.links.current).to.have.lengthOf(5);
        expect(user.getAttribute("groups").value.links.current[0].id).to.equal("4th");
        expect(user.getAttribute("groups").value.links.current[1].id).to.equal("5th");
        expect(user.getAttribute("groups").value.links.current[2].id).to.equal("6th");
        expect(user.getAttribute("groups").value.links.current[3].id).to.equal("7th");
        expect(user.getAttribute("groups").value.links.current[4].id).to.equal("8th");

        // Let's try to remove values using shift / pop - deletes should occur.
        groups.pop();
        groups.shift();

        const entityDelete = sandbox.spy(user.getDriver(), "delete");
        entitySave = sandbox.stub(user.getDriver(), "save");
        await user.save();

        expect(entitySave.callCount).to.equal(7);
        expect(entityDelete.callCount).to.equal(2);

        entitySave.restore();
        entityDelete.restore();

        expect(user.getAttribute("groups").value.initial).to.have.lengthOf(3);
        expect(user.getAttribute("groups").value.initial[0].id).to.equal("Q");
        expect(user.getAttribute("groups").value.initial[1].id).to.equal("I");
        expect(user.getAttribute("groups").value.initial[2].id).to.equal("J");
        expect(user.getAttribute("groups").value.current).to.have.lengthOf(3);
        expect(user.getAttribute("groups").value.current[0].id).to.equal("Q");
        expect(user.getAttribute("groups").value.current[1].id).to.equal("I");
        expect(user.getAttribute("groups").value.current[2].id).to.equal("J");

        expect(user.getAttribute("groups").value.links.initial).to.have.lengthOf(3);
        expect(user.getAttribute("groups").value.links.initial[0].id).to.equal("5th");
        expect(user.getAttribute("groups").value.links.initial[1].id).to.equal("6th");
        expect(user.getAttribute("groups").value.links.initial[2].id).to.equal("7th");

        expect(user.getAttribute("groups").value.links.current).to.have.lengthOf(3);
        expect(user.getAttribute("groups").value.links.current[0].id).to.equal("5th");
        expect(user.getAttribute("groups").value.links.current[1].id).to.equal("6th");
        expect(user.getAttribute("groups").value.links.current[2].id).to.equal("7th");
    });
});
