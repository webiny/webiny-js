import { assert } from "chai";

import sinon from "sinon";
import SimpleEntity from "./entities/simpleEntity";

const sandbox = sinon.sandbox.create();

describe("find test", function() {
    afterEach(() => sandbox.restore());
    beforeEach(() => SimpleEntity.getEntityPool().flush());

    it("find - should find entities and total count", async () => {
        sandbox.stub(SimpleEntity.getDriver().getConnection(), "query").callsFake(() => [
            [
                {
                    id: 1,
                    name: "This is a test",
                    slug: "thisIsATest",
                    enabled: 1
                },
                {
                    id: 2,
                    name: "This is a test 222",
                    slug: "thisIsATest222",
                    enabled: 0
                }
            ],
            [
                {
                    count: 2
                }
            ]
        ]);

        const entities = await SimpleEntity.find();
        SimpleEntity.getDriver()
            .getConnection()
            .query.restore();

        assert.isArray(entities);
        assert.lengthOf(entities, 2);

        assert.equal(entities[0].id, 1);
        assert.equal(entities[0].name, "This is a test");
        assert.equal(entities[0].slug, "thisIsATest");
        assert.isTrue(entities[0].enabled);

        assert.equal(entities[1].id, 2);
        assert.equal(entities[1].name, "This is a test 222");
        assert.equal(entities[1].slug, "thisIsATest222");
        assert.isFalse(entities[1].enabled);
    });

    it("find - must change page and perPage parameters into limit / offset accordingly", async () => {
        const querySpy = sandbox
            .stub(SimpleEntity.getDriver().getConnection(), "query")
            .callsFake(() => {
                return [[], [{ count: 0 }]];
            });
        await SimpleEntity.find({
            page: 3,
            perPage: 7,
            query: { age: 30 },
            order: [["createdOn", -1], ["id", 1]]
        });

        assert.deepEqual(querySpy.getCall(0).args[0], [
            "SELECT * FROM `SimpleEntity` WHERE (age = 30) ORDER BY createdOn DESC, id ASC LIMIT 7 OFFSET 14",
            "SELECT FOUND_ROWS() as count"
        ]);

        SimpleEntity.getDriver()
            .getConnection()
            .query.restore();
    });
});
