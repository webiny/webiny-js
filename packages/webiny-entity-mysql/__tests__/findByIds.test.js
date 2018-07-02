import sinon from "sinon";
import SimpleEntity from "./entities/simpleEntity";
const sandbox = sinon.sandbox.create();

describe("findByIds test", () => {
    afterEach(() => sandbox.restore());
    beforeEach(() => SimpleEntity.getEntityPool().flush());

    test("must generate correct query", async () => {
        const queryStub = sandbox
            .stub(SimpleEntity.getDriver().getConnection(), "query")
            .callsFake(() => {
                return [[], [{ count: null }]];
            });

        await SimpleEntity.findByIds(["a", "b", "c"]);

        expect(queryStub.getCall(0).args[0]).toEqual(
            "SELECT * FROM `SimpleEntity` WHERE (`id` = 'a') LIMIT 1"
        );
        expect(queryStub.getCall(1).args[0]).toEqual(
            "SELECT * FROM `SimpleEntity` WHERE (`id` = 'b') LIMIT 1"
        );
        expect(queryStub.getCall(2).args[0]).toEqual(
            "SELECT * FROM `SimpleEntity` WHERE (`id` = 'c') LIMIT 1"
        );
        expect(queryStub.getCall(3)).toBeNil();

        queryStub.restore();
    });

    test("findByIds - should find previously inserted entities", async () => {
        sandbox
            .stub(SimpleEntity.getDriver().getConnection(), "query")
            .onCall(0)
            .callsFake(() => {
                return [
                    {
                        id: 1,
                        name: "This is a test",
                        slug: "thisIsATest",
                        enabled: 1
                    }
                ];
            })
            .onCall(1)
            .callsFake(() => {
                return [
                    {
                        id: 2,
                        name: "This is a test 222",
                        slug: "thisIsATest222",
                        enabled: 0
                    }
                ];
            });

        const simpleEntities = await SimpleEntity.findByIds([1, 2]);
        SimpleEntity.getDriver()
            .getConnection()
            .query.restore();

        expect(simpleEntities[0].id).toEqual(1);
        expect(simpleEntities[0].name).toEqual("This is a test");
        expect(simpleEntities[0].slug).toEqual("thisIsATest");
        expect(simpleEntities[0].enabled).toBe(true);

        expect(simpleEntities[1].id).toEqual(2);
        expect(simpleEntities[1].name).toEqual("This is a test 222");
        expect(simpleEntities[1].slug).toEqual("thisIsATest222");
        expect(simpleEntities[1].enabled).toBe(false);
    });
});
