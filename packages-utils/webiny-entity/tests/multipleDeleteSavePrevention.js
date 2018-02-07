import { expect } from "chai";
import sinon from "sinon";
import { Entity } from "./..";

const sandbox = sinon.sandbox.create();

class User extends Entity {
    constructor() {
        super();
    }
}

describe("multiple delete / save prevention test", async function() {
    afterEach(() => sandbox.restore());
    beforeEach(() => User.getEntityPool().flush());

    it("should only call save once", async () => {
        const user = new User();
        const save = sandbox.spy(User.getDriver(), "save");

        const promise = user.save();
        user.save();
        user.save();
        user.save();

        await promise;

        expect(save.callCount).to.equal(1);
    });

    it("should only call delete once", async () => {
        const user = new User();
        user.id = "asd";

        const deleteOperation = sandbox.spy(User.getDriver(), "delete");

        const promise = user.delete();
        await user.delete();
        await user.delete();
        await user.delete();

        await promise;

        expect(deleteOperation.callCount).to.equal(1);

        user.processing = "delete";
        await user.delete();
        user.processing = null;

        expect(deleteOperation.callCount).to.equal(1);
    });
});
