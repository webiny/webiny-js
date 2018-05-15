// @flow
// import { Entity } from "webiny-api";
/*import { MemoryDriver } from "webiny-entity-memory";
import { EntityCollection } from "webiny-entity";
import Security from "../src/services/security";
import Authorization from "../src/services/security";
import MyUser from "./entities/myUser";
import chai from "./utils/chai";
import importData from "./utils/importData";
import { Class1, Class2, Class3 } from "./authorization/endpoints";
import registerAttributes from "./../src/attributes/registerAttributes";*/
/*

const { expect } = chai;

describe("Authorization test", () => {
    let auth: Authorization;

    before(() => {
        // Create Authentication service
        auth = new Authorization();

        // Configure Memory entity driver
        const memoryDriver = new MemoryDriver();
        importData(memoryDriver);
        Entity.driver = memoryDriver;

        const authentication = new Security({
            identities: [{ identity: MyUser }]
        });

        registerAttributes(authentication);
    });

    it("should return a collection of roles", async () => {
        let user = await MyUser.findById("user1");
        const roles = await user.getRoles();
        expect(roles).to.be.instanceof(Array);
    });

    it("should return a collection of permissions", async () => {
        let user = await MyUser.findById("user1");
        const roles = await user.getRoles();
        const permissions = await roles[0].permissions;
        expect(permissions).to.be.instanceof(EntityCollection);
    });

    it("should confirm that identity has a role", async () => {
        const user = await MyUser.findById("user1");
        expect(await user.hasRole("role1")).to.be.true;
    });

    it("should confirm that identity doesn't have a role", async () => {
        const user = await MyUser.findById("user1");
        return expect(user.hasRole("no-role")).to.become(false);
    });

    it("should throw if passed an invalid `authorizable`", async () => {
        const endpoint1 = new Class1();
        const apiMethod1 = endpoint1.getApi().getMethod("method1");
        // $FlowIgnore
        expect(auth.canExecute(apiMethod1, false)).to.be.rejectedWith(AuthorizationError);
    });
});
*/
