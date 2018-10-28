import sinon from "sinon";
import SimpleEntity from "./entities/simpleEntity";
import CustomIdEntity from "./entities/customIdEntity";

const sandbox = sinon.sandbox.create();

describe("save test", () => {
    afterEach(() => sandbox.restore());

    test("must generate correct query", async () => {
        const queryStub = sandbox
            .stub(SimpleEntity.getDriver().getConnection(), "query")
            .callsFake(() => {
                return [[], [{ count: null }]];
            });

        const simpleEntity = new SimpleEntity();
        await simpleEntity.save();

        // 'slug' and 'enabled' have default value set, that's why they are present in following statement.
        expect(queryStub.getCall(0).args[0]).toEqual(
            "INSERT INTO `SimpleEntity` (`id`, `slug`, `enabled`) VALUES ('" +
                simpleEntity.id +
                "', '', 1)"
        );

        simpleEntity.name = "test case";
        simpleEntity.slug = "testCase";
        simpleEntity.enabled = false;
        simpleEntity.tags = ["test1", "test2"];

        await simpleEntity.save();
        expect(queryStub.getCall(1).args[0]).toEqual(
            "UPDATE `SimpleEntity` SET `name` = 'test case', `slug` = 'testCase', `enabled` = 0, `tags` = '[\\\"test1\\\",\\\"test2\\\"]' WHERE (`id` = '" +
                simpleEntity.id +
                "') LIMIT 1"
        );

        queryStub.restore();
    });

    test("must generate correct query - use manually assigned ID (works only when not in autoIncrement mode)", async () => {
        const queryStub = sandbox
            .stub(SimpleEntity.getDriver().getConnection(), "query")
            .callsFake(() => {
                return [[], [{ count: null }]];
            });

        const simpleEntity = new SimpleEntity();

        simpleEntity.id = "123";
        let error = null;
        try {
            await simpleEntity.save();
        } catch (e) {
            error = e;
        }

        expect(error !== null).toBeTrue();
        expect(error.message).toBe("You have assigned an invalid id (123)");

        simpleEntity.id = "aaaaaaaaaabbbbbbbbbbcccc";
        await simpleEntity.save();

        // 'slug' and 'enabled' have default value set, that's why they are present in following statement.
        expect(queryStub.getCall(0).args[0]).toEqual(
            "INSERT INTO `SimpleEntity` (`id`, `slug`, `enabled`) VALUES ('aaaaaaaaaabbbbbbbbbbcccc', '', 1)"
        );

        simpleEntity.name = "test case";
        simpleEntity.slug = "testCase";
        simpleEntity.enabled = false;
        simpleEntity.tags = ["test1", "test2"];

        await simpleEntity.save();
        expect(queryStub.getCall(1).args[0]).toEqual(
            "UPDATE `SimpleEntity` SET `name` = 'test case', `slug` = 'testCase', `enabled` = 0, `tags` = '[\\\"test1\\\",\\\"test2\\\"]' WHERE (`id` = '" +
                simpleEntity.id +
                "') LIMIT 1"
        );

        queryStub.restore();
    });

    test("should save new entity into database and entity should receive an integer ID", async () => {
        sandbox.stub(SimpleEntity.getDriver().getConnection(), "query");

        const simpleEntity = new SimpleEntity();
        await simpleEntity.save();
        SimpleEntity.getDriver()
            .getConnection()
            .query.restore();

        expect(simpleEntity.id.length).toBe(24);
        expect(SimpleEntity.isId(simpleEntity.id)).toBe(true);
    });

    test("should update existing entity", async () => {
        sandbox.stub(SimpleEntity.getDriver().getConnection(), "query").callsFake(() => {});
        sandbox.stub(SimpleEntity.getDriver().constructor, "__generateID").callsFake(() => {
            return "a";
        });

        const simpleEntity = new SimpleEntity();
        await simpleEntity.save();

        expect(simpleEntity.id).toEqual("a");

        await simpleEntity.save();
        SimpleEntity.getDriver()
            .getConnection()
            .query.restore();
        expect(simpleEntity.id).toEqual("a");
    });

    test("should save new entity into database and entity should receive a hash ID", async () => {
        sandbox.stub(CustomIdEntity.getDriver().getConnection(), "query").callsFake(() => {
            return { insertId: 1 };
        });

        const customIdEntity = new CustomIdEntity();
        customIdEntity.name = "test";

        await customIdEntity.save();
        CustomIdEntity.getDriver()
            .getConnection()
            .query.restore();

        expect(typeof customIdEntity.id).toBe("string");
        expect(customIdEntity.id.length).toBe(24);
    });
});
