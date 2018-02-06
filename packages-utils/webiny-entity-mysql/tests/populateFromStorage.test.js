import { assert } from "chai";

import sinon from "sinon";
import { ComplexEntity, SimpleEntity } from "./entities/complexEntity";
const sandbox = sinon.sandbox.create();

describe("populateFromStorage test", function() {
    afterEach(() => sandbox.restore());
    beforeEach(() => ComplexEntity.getEntityPool().flush());

    it("should populate entity correctly with data received from MySQL", async () => {
        sandbox.stub(ComplexEntity.getDriver().getConnection(), "query").callsFake(() => {
            return [
                {
                    firstName: "test",
                    lastName: "tester",
                    verification: `{"verified":true,"documentType":"driversLicense"}`,
                    tags: `[{"slug":"no-name","label":"No Name"},{"slug":"adult-user","label":"Adult User"}]`,
                    simpleEntity: 1,
                    simpleEntities: "[22, 33, 44]"
                }
            ];
        });

        let user = new ComplexEntity();
        assert.isFalse(user.getAttribute("simpleEntity").value.isLoading());
        assert.isFalse(user.getAttribute("simpleEntity").value.isLoaded());

        user = await ComplexEntity.findById(1);
        assert.isFalse(user.getAttribute("simpleEntity").value.isLoading());
        assert.isFalse(user.getAttribute("simpleEntity").value.isLoaded());

        ComplexEntity.getDriver()
            .getConnection()
            .query.restore();

        assert.equal(user.firstName, "test");
        assert.equal(user.lastName, "tester");
        assert.isTrue(user.verification.verified);
        assert.equal(user.verification.documentType, "driversLicense");
        assert.equal(user.tags[0].slug, "no-name");
        assert.equal(user.tags[0].label, "No Name");
        assert.equal(user.tags[1].slug, "adult-user");
        assert.equal(user.tags[1].label, "Adult User");
        assert.lengthOf(user.tags, 2);

        assert.equal(user.getAttribute("simpleEntity").value.getCurrent(), 1);

        sandbox.stub(user.getDriver().getConnection(), "query").callsFake(() => {
            return [{ id: 1, name: "Test-1" }];
        });

        const simpleEntity = await user.simpleEntity;
        user
            .getDriver()
            .getConnection()
            .query.restore();

        assert.equal(simpleEntity.id, 1);
        assert.equal(simpleEntity.name, "Test-1");

        assert.equal(user.getAttribute("simpleEntities").value.getCurrent()[0], 22);
        assert.equal(user.getAttribute("simpleEntities").value.getCurrent()[1], 33);
        assert.equal(user.getAttribute("simpleEntities").value.getCurrent()[2], 44);

        sandbox
            .stub(user.getDriver().getConnection(), "query")
            .onCall(0)
            .callsFake(() => {
                return [
                    [
                        { id: 2, name: "Test-2" },
                        { id: 3, name: "Test-3" },
                        { id: 4, name: "Test-4" }
                    ],
                    [{ count: 3 }]
                ];
            });

        assert.lengthOf(await user.simpleEntities, 3);

        const simpleEntities = await user.simpleEntities;
        assert.instanceOf(simpleEntities[0], SimpleEntity);
        assert.equal(simpleEntities[0].id, 2);
        assert.equal(simpleEntities[0].name, "Test-2");

        assert.instanceOf(simpleEntities[1], SimpleEntity);
        assert.equal(simpleEntities[1].id, 3);
        assert.equal(simpleEntities[1].name, "Test-3");

        assert.instanceOf(simpleEntities[2], SimpleEntity);
        assert.equal(simpleEntities[2].id, 4);
        assert.equal(simpleEntities[2].name, "Test-4");

        user
            .getDriver()
            .getConnection()
            .query.restore();
    });
});
