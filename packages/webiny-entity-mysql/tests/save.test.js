import { assert } from "chai";
import sinon from "sinon";
import SimpleEntity from "./entities/simpleEntity";
import CustomIdEntity from "./entities/customIdEntity";

const sandbox = sinon.sandbox.create();

describe("save test", function() {
    afterEach(() => sandbox.restore());

    it("must generate correct query", async () => {
        const queryStub = sandbox
            .stub(SimpleEntity.getDriver().getConnection(), "query")
            .callsFake(() => {
                return [[], [{ count: null }]];
            });

        const simpleEntity = new SimpleEntity();
        await simpleEntity.save();

        // 'slug' and 'enabled' have default value set, that's why they are present in following statement.
        assert.deepEqual(
            queryStub.getCall(0).args[0],
            "INSERT INTO `SimpleEntity` (`id`, `slug`, `enabled`) VALUES ('" +
                simpleEntity.id +
                "', '', 1)"
        );

        simpleEntity.name = "test case";
        simpleEntity.slug = "testCase";
        simpleEntity.enabled = false;
        simpleEntity.tags = ["test1", "test2"];

        await simpleEntity.save();
        assert.deepEqual(
            queryStub.getCall(1).args[0],
            "UPDATE `SimpleEntity` SET `name` = 'test case', `slug` = 'testCase', `enabled` = 0, `tags` = '[\\\"test1\\\",\\\"test2\\\"]' WHERE (id = '" +
                simpleEntity.id +
                "') LIMIT 1"
        );

        queryStub.restore();
    });

    it("should save new entity into database and entity should receive an integer ID", async () => {
        sandbox.stub(SimpleEntity.getDriver().getConnection(), "query");

        const simpleEntity = new SimpleEntity();
        await simpleEntity.save();
        SimpleEntity.getDriver()
            .getConnection()
            .query.restore();

        assert.lengthOf(simpleEntity.id, 24);
        assert.isTrue(SimpleEntity.isId(simpleEntity.id));
    });

    it("should update existing entity", async () => {
        sandbox.stub(SimpleEntity.getDriver().getConnection(), "query").callsFake(() => {});
        sandbox.stub(SimpleEntity.getDriver().constructor, "__generateID").callsFake(() => {
            return "a";
        });

        const simpleEntity = new SimpleEntity();
        await simpleEntity.save();

        assert.equal(simpleEntity.id, "a");

        await simpleEntity.save();
        SimpleEntity.getDriver()
            .getConnection()
            .query.restore();
        assert.equal(simpleEntity.id, "a");
    });

    it("should save new entity into database and entity should receive a hash ID", async () => {
        sandbox.stub(CustomIdEntity.getDriver().getConnection(), "query").callsFake(() => {
            return { insertId: 1 };
        });

        const customIdEntity = new CustomIdEntity();
        customIdEntity.name = "test";

        await customIdEntity.save();
        CustomIdEntity.getDriver()
            .getConnection()
            .query.restore();

        assert.isString(customIdEntity.id);
        assert.lengthOf(customIdEntity.id, 24);
    });
});
