import { MemoryDriver } from "webiny-entity-memory";
import { Entity, File } from "webiny-api/entities";
import { api } from "webiny-api";
import SecurityService from "webiny-api/services/securityService";
import JwtToken from "webiny-api/security/tokens/jwtToken";
import User from "./User.entity";

import registerIdentityAttribute from "webiny-api/attributes/registerIdentityAttribute";
import registerPasswordAttribute from "webiny-api/attributes/registerPasswordAttribute";
import registerFileAttributes from "webiny-api/attributes/registerFileAttributes";
import registerBufferAttribute from "webiny-api/attributes/registerBufferAttribute";

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
