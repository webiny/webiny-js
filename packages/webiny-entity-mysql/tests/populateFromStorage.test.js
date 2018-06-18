import sinon from "sinon";
import { ComplexEntity, SimpleEntity } from "./entities/complexEntity";
const sandbox = sinon.sandbox.create();

describe("populateFromStorage test", () => {
    afterEach(() => sandbox.restore());
    beforeEach(() => ComplexEntity.getEntityPool().flush());

    test("should populate entity correctly with data received from MySQL", async () => {
        sandbox.stub(ComplexEntity.getDriver().getConnection(), "query").callsFake(() => {
            return [
                {
                    firstName: "test",
                    lastName: "tester",
                    verification: `{"verified":true,"documentType":"driversLicense"}`,
                    tags: `[{"slug":"no-name","label":"No Name"},{"slug":"adult-user","label":"Adult User"}]`,
                    simpleEntity: "01234567890123456789adee",
                    simpleEntities: "[22, 33, 44]"
                }
            ];
        });

        let user = new ComplexEntity();
        expect(user.getAttribute("simpleEntity").value.isLoading()).toBe(false);
        expect(user.getAttribute("simpleEntity").value.isLoaded()).toBe(false);

        user = await ComplexEntity.findById(1);
        expect(user.getAttribute("simpleEntity").value.isLoading()).toBe(false);
        expect(user.getAttribute("simpleEntity").value.isLoaded()).toBe(false);

        ComplexEntity.getDriver()
            .getConnection()
            .query.restore();

        expect(user.firstName).toEqual("test");
        expect(user.lastName).toEqual("tester");
        expect(user.verification.verified).toBe(true);
        expect(user.verification.documentType).toEqual("driversLicense");
        expect(user.tags[0].slug).toEqual("no-name");
        expect(user.tags[0].label).toEqual("No Name");
        expect(user.tags[1].slug).toEqual("adult-user");
        expect(user.tags[1].label).toEqual("Adult User");
        expect(user.tags.length).toBe(2);

        expect(user.getAttribute("simpleEntity").value.getCurrent()).toEqual(
            "01234567890123456789adee"
        );

        sandbox.stub(user.getDriver().getConnection(), "query").callsFake(() => {
            return [{ id: "01234567890123456789adee", name: "Test-1" }];
        });

        const simpleEntity = await user.simpleEntity;
        user.getDriver()
            .getConnection()
            .query.restore();

        expect(simpleEntity.id).toEqual("01234567890123456789adee");
        expect(simpleEntity.name).toEqual("Test-1");

        expect(user.getAttribute("simpleEntities").value.getCurrent()[0]).toEqual(22);
        expect(user.getAttribute("simpleEntities").value.getCurrent()[1]).toEqual(33);
        expect(user.getAttribute("simpleEntities").value.getCurrent()[2]).toEqual(44);

        sandbox
            .stub(user.getDriver().getConnection(), "query")
            .onCall(0)
            .callsFake(() => {
                return [{ id: 2, name: "Test-2" }];
            })
            .onCall(1)
            .callsFake(() => {
                return [{ id: 3, name: "Test-3" }];
            })
            .onCall(2)
            .callsFake(() => {
                return [{ id: 4, name: "Test-4" }];
            });

        expect(await user.simpleEntities).toHaveLength(3);

        const simpleEntities = await user.simpleEntities;
        expect(simpleEntities[0]).toBeInstanceOf(SimpleEntity);
        expect(simpleEntities[0].id).toEqual(2);
        expect(simpleEntities[0].name).toEqual("Test-2");

        expect(simpleEntities[1]).toBeInstanceOf(SimpleEntity);
        expect(simpleEntities[1].id).toEqual(3);
        expect(simpleEntities[1].name).toEqual("Test-3");

        expect(simpleEntities[2]).toBeInstanceOf(SimpleEntity);
        expect(simpleEntities[2].id).toEqual(4);
        expect(simpleEntities[2].name).toEqual("Test-4");

        user.getDriver()
            .getConnection()
            .query.restore();
    });
});
