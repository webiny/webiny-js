import { QueryResult } from "../../../../../src/index";
import { MainEntity } from "../../../../entities/entitiesAttributeEntities";
import { assert, expect } from "chai";
import sinon from "sinon";
import { Group, User, UsersGroups } from "../../../../entities/entitiesUsing";

const sandbox = sinon.sandbox.create();

describe("save and delete entities attribute test", () => {
    afterEach(() => sandbox.restore());
    beforeEach(() => MainEntity.getEntityPool().flush());

    it("should wait until entities are loaded if loading is in progress", async () => {
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

        // This action is async, and following save should wait until the attribute is fully loaded.
        user.groups = [{ name: "Group P" }, { name: "Group Q" }];

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
    });
});
