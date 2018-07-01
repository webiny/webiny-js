import sinon from "sinon";
import { Entity } from "webiny-entity";

const sandbox = sinon.sandbox.create();

class User extends Entity {
    constructor() {
        super();
    }
}

describe("multiple delete / save prevention test", async () => {
    afterEach(() => sandbox.restore());
    beforeEach(() => User.getEntityPool().flush());

    test("should only call save once", async () => {
        const user = new User();
        const save = sandbox.spy(User.getDriver(), "save");

        const promise = user.save();
        user.save();
        user.save();
        user.save();

        await promise;

        expect(user.isClean()).toEqual(true);
        expect(save.callCount).toEqual(0);
    });

    test("should only call delete once", async () => {
        const user = new User();
        user.id = "asd";

        const deleteOperation = sandbox.spy(User.getDriver(), "delete");

        const promise = user.delete();
        const promise2 = await user.delete();
        await user.delete();
        await user.delete();
        await user.delete();

        await promise;
        await promise2;

        expect(deleteOperation.callCount).toEqual(1);

        user.processing = "delete";
        await user.delete();
        user.processing = null;

        expect(deleteOperation.callCount).toEqual(1);
    });
});
