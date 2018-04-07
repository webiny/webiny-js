import { assert } from "chai";
import sinon from "sinon";
import { QueryResult } from "webiny-entity";

import { Company, User, Issue } from "./entities/identityAttributeEntities";
import Authentication from "../src/services/authentication";
import registerAttributes from "./../src/attributes/registerAttributes";

const sandbox = sinon.sandbox.create();

describe("Identity attribute test", () => {
    before(() => {
        // Setup Authentication service
        const authentication = new Authentication({
            identities: [{ identity: User }, { identity: Company }]
        });

        registerAttributes(authentication);
    });

    afterEach(() => sandbox.restore());
    beforeEach(() => User.getEntityPool().flush());

    /*  it("should have roles and rolesGroups attributes", async () => {
        const user = new User();
        assert.hasAnyKeys(user.getAttributes(), [
            "roleGroups",
            "roles"
        ]);
    });

    it("should be able to receive roles as slugs", async () => {
        const user = new User();
        user.roles = ['role-1', 'role-2'];
        assert.deepEqual(user.getAttribute('roles').value.state, {loading: false, loaded: false});
        assert.deepEqual(user.getAttribute('roles').value.current, ['role-1', 'role-2']);
    });

    it("should be able to receive roles as ids", async () => {
        const user = new User();
    });
    it("should be able to receive roles as objects with ids", async () => {
        const user = new User();
    });

    it("should be able to receive roles as objects with slugs", async () => {
        const user = new User();
    });

*/
});
