import { assert } from "chai";

import sinon from "sinon";
import SimpleEntity from "./entities/simpleEntity";

const sandbox = sinon.sandbox.create();

describe("find test", function() {
    afterEach(() => sandbox.restore());
    beforeEach(() => SimpleEntity.getEntityPool().flush());

    it("find - must generate simple query correctly", async () => {
        const queryStub = sandbox
            .stub(SimpleEntity.getDriver().getConnection(), "query")
            .callsFake(() => {
                return [[], [{ count: null }]];
            });

        await SimpleEntity.find();

        assert.deepEqual(queryStub.getCall(0).args[0], [
            "SELECT SQL_CALC_FOUND_ROWS * FROM `SimpleEntity` LIMIT 10",
            "SELECT FOUND_ROWS() as count"
        ]);

        queryStub.restore();
    });

    it("should find entities and total count", async () => {
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

    it("must change page and perPage parameters into limit / offset accordingly", async () => {
        const querySpy = sandbox
            .stub(SimpleEntity.getDriver().getConnection(), "query")
            .callsFake(() => {
                return [[], [{ count: 0 }]];
            });
        await SimpleEntity.find({
            page: 3,
            perPage: 7,
            query: { age: 30 },
            sort: { createdOn: -1, id: 1 }
        });

        assert.deepEqual(querySpy.getCall(0).args[0], [
            "SELECT SQL_CALC_FOUND_ROWS * FROM `SimpleEntity` WHERE (`age` = 30) ORDER BY createdOn DESC, id ASC LIMIT 7 OFFSET 14",
            "SELECT FOUND_ROWS() as count"
        ]);

        SimpleEntity.getDriver()
            .getConnection()
            .query.restore();
    });

    it("JSON - find single value in an array", async () => {
        const querySpy = sandbox
            .stub(SimpleEntity.getDriver().getConnection(), "query")
            .callsFake(() => {
                return [[], [{ count: 0 }]];
            });
        await SimpleEntity.find({
            query: { tags: "user" }
        });

        assert.deepEqual(querySpy.getCall(0).args[0], [
            "SELECT SQL_CALC_FOUND_ROWS * FROM `SimpleEntity` WHERE (JSON_SEARCH(`tags`, 'one', 'user') IS NOT NULL) LIMIT 10",
            "SELECT FOUND_ROWS() as count"
        ]);

        SimpleEntity.getDriver()
            .getConnection()
            .query.restore();
    });

    it("JSON - find exact array value", async () => {
        const querySpy = sandbox
            .stub(SimpleEntity.getDriver().getConnection(), "query")
            .callsFake(() => {
                return [[], [{ count: 0 }]];
            });

        await SimpleEntity.find({
            query: { tags: ["user", "avatar"] }
        });

        assert.deepEqual(querySpy.getCall(0).args[0], [
            "SELECT SQL_CALC_FOUND_ROWS * FROM `SimpleEntity` WHERE (`tags` = JSON_ARRAY('user', 'avatar')) LIMIT 10",
            "SELECT FOUND_ROWS() as count"
        ]);

        SimpleEntity.getDriver()
            .getConnection()
            .query.restore();
    });

    it("JSON - match at least one array value inside the target array", async () => {
        const querySpy = sandbox
            .stub(SimpleEntity.getDriver().getConnection(), "query")
            .callsFake(() => {
                return [[], [{ count: 0 }]];
            });

        await SimpleEntity.find({
            query: { tags: { $in: ["user", "avatar"] } }
        });

        assert.deepEqual(querySpy.getCall(0).args[0], [
            "SELECT SQL_CALC_FOUND_ROWS * FROM `SimpleEntity` WHERE ((JSON_SEARCH(`tags`, 'one', 'user') IS NOT NULL OR JSON_SEARCH(`tags`, 'one', 'avatar') IS NOT NULL)) LIMIT 10",
            "SELECT FOUND_ROWS() as count"
        ]);

        SimpleEntity.getDriver()
            .getConnection()
            .query.restore();
    });

    it("JSON - match all array values inside the target array", async () => {
        const querySpy = sandbox
            .stub(SimpleEntity.getDriver().getConnection(), "query")
            .callsFake(() => {
                return [[], [{ count: 0 }]];
            });

        await SimpleEntity.find({
            query: { tags: { $all: ["user", "avatar"] } }
        });

        assert.deepEqual(querySpy.getCall(0).args[0], [
            "SELECT SQL_CALC_FOUND_ROWS * FROM `SimpleEntity` WHERE ((JSON_SEARCH(`tags`, 'one', 'user') IS NOT NULL AND JSON_SEARCH(`tags`, 'one', 'avatar') IS NOT NULL)) LIMIT 10",
            "SELECT FOUND_ROWS() as count"
        ]);

        SimpleEntity.getDriver()
            .getConnection()
            .query.restore();
    });
});
