import { User, Group, UsersGroups } from "../../../../entities/entitiesUsing";
import { expect } from "chai";
import sinon from "sinon";
import { QueryResult } from "../../../../../src";

const sandbox = sinon.sandbox.create();

describe("attribute entities (using an additional aggregation class) - loading test", function() {
    afterEach(function() {
        sandbox.restore();
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

        entityFind.restore();
    });
});
