import { User, Group, UsersGroups } from "../../../../entities/entitiesUsing";
import { expect } from "chai";
import sinon from "sinon";
import { QueryResult } from "../../../../../src";

const sandbox = sinon.sandbox.create();

describe("attribute entities (using an additional aggregation class) - saving test", function() {
    afterEach(function() {
        sandbox.restore();
    });

    it("should assign existing values correctly and track links that need to be deleted on consequent save method calls", async () => {
        let entityFindById = sandbox
            .stub(User.getDriver(), "findById")
            .callsFake(() => new QueryResult({ id: "A" }));
        const user = await User.findById(123);
        entityFindById.restore();

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

        await user.set("groups", [{ id: "P", name: "Group P" }, { id: "Q", name: "Group Q" }]);

        expect(user.getAttribute("groups").value.initial).to.have.lengthOf(3);
        expect(user.getAttribute("groups").value.initial[0].id).to.equal("X");
        expect(user.getAttribute("groups").value.initial[1].id).to.equal("Y");
        expect(user.getAttribute("groups").value.initial[2].id).to.equal("Z");
        expect(user.getAttribute("groups").value.current).to.have.lengthOf(2);
        expect(user.getAttribute("groups").value.current[0].id).to.equal("P");
        expect(user.getAttribute("groups").value.current[1].id).to.equal("Q");

        try {
            await user.save();
        } catch (e) {
            console.log(e);
        }
        entityFindById.restore();
        entityFind.restore();
    });
});
