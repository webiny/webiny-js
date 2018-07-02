import sinon from "sinon";
import SimpleEntity from "./entities/simpleEntity";
import CustomIdEntity from "./entities/customIdEntity";
const sandbox = sinon.sandbox.create();

describe("save error test", () => {
    afterEach(() => sandbox.restore());

    test("should save new entity but an exception must be thrown", async () => {
        sandbox.stub(SimpleEntity.getDriver().getConnection(), "query").callsFake(() => {
            throw Error("This is an error.");
        });

        const simpleEntity = new SimpleEntity();
        try {
            await simpleEntity.save();
        } catch (e) {
            return;
        } finally {
            SimpleEntity.getDriver()
                .getConnection()
                .query.restore();
        }
        throw Error(`Error should've been thrown.`);
    });

    test("should update existing entity but an exception must be thrown", async () => {
        sandbox.stub(SimpleEntity.getDriver().getConnection(), "query").callsFake(() => {});
        sandbox.stub(SimpleEntity.getDriver().constructor, "__generateID").callsFake(() => "a");

        const simpleEntity = new SimpleEntity();
        await simpleEntity.save();
        SimpleEntity.getDriver()
            .getConnection()
            .query.restore();

        expect(simpleEntity.id).toEqual("a");

        sandbox
            .stub(SimpleEntity.getDriver().getConnection(), "query")
            .callsFake((query, callback) => {
                callback(new Error("This is an error."));
            });

        try {
            simpleEntity.name = "test";
            await simpleEntity.save();
        } catch (e) {
            return;
        } finally {
            SimpleEntity.getDriver()
                .getConnection()
                .query.restore();
        }
        throw Error(`Error should've been thrown.`);
    });

    test("should save new entity into database (with hash IDs enabled), but an exception must be thrown", async () => {
        sandbox.stub(CustomIdEntity.getDriver().getConnection(), "query").callsFake(() => {
            throw Error("This is an error.");
        });

        const customIdEntity = new CustomIdEntity();
        customIdEntity.name = "test";

        try {
            await customIdEntity.save();
        } catch (e) {
            return;
        } finally {
            expect(customIdEntity.id).toEqual(null);
            CustomIdEntity.getDriver()
                .getConnection()
                .query.restore();
        }

        throw Error(`Error should've been thrown.`);
    });
});
