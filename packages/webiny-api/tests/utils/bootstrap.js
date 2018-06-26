import { MemoryDriver } from "webiny-entity-memory";
import { Entity, File, api } from "../../src";
import SecurityService from "../../src/services/securityService";
import JwtToken from "../../src/security/tokens/jwtToken";
import User from "./User.entity";

import registerIdentityAttribute from "./../../src/attributes/registerIdentityAttribute";
import registerPasswordAttribute from "./../../src/attributes/registerPasswordAttribute";
import registerFileAttributes from "./../../src/attributes/registerFileAttributes";
import registerBufferAttribute from "../../src/attributes/registerBufferAttribute";

export default () => {
    // Register service (for identity attribute).
    api.services.register("security", () => {
        return new SecurityService({
            token: new JwtToken({ secret: "MyS3cr3tK3Y" }),
            identities: [{ identity: User }]
        });
    });

    // Configure Memory entity driver.
    Entity.driver = new MemoryDriver();

    // Register attributes.
    registerIdentityAttribute();
    registerPasswordAttribute();
    registerFileAttributes({ entity: File });
    registerBufferAttribute();
};
