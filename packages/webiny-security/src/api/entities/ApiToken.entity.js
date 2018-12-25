// @flow
import { Entity } from "webiny-entity";
import { JwtToken } from "webiny-security/api/plugins/authentication/jwtToken";
import type { Group } from "./Group.entity";
import type { Role } from "./Role.entity";
import { loadEntityScopes } from "./utils";

export interface IApiToken extends Entity {
    name: string;
    token: string;
    description: string;
    groups: Promise<Array<Group>>;
    roles: Promise<Array<Role>>;
    scopes: Promise<Array<string>>;
    generateJWT(): Promise<void>;
}

export function apiTokenFactory({
    user = {},
    config,
    api: { entities }
}: Object): Class<IApiToken> {
    return class extends Entity {
        static classId = "SecurityApiToken";
        static storageClassId = "Security_ApiTokens";

        name: string;
        token: string;
        description: string;
        groups: Promise<Array<Group>>;
        roles: Promise<Array<Role>>;
        scopes: Promise<Array<string>>;

        constructor() {
            super();

            this.attr("createdBy")
                .char()
                .setDefaultValue(user.id);
            this.attr("name").char();
            this.attr("token").char();
            this.attr("description").char();

            this.attr("roles")
                .entities(entities.Role, "entity")
                .setUsing(entities.Roles2Entities, "role");

            this.attr("groups")
                .entities(entities.Group, "entity")
                .setUsing(entities.Groups2Entities, "group");

            this.attr("scopes")
                .array()
                .setDynamic(() => {
                    return loadEntityScopes.call(this);
                });
        }

        async generateJWT(): Promise<void> {
            // 2147483647 = maximum value of unix timestamp (year 2038).
            const token = new JwtToken({ secret: config.security.token.secret });
            this.token = await token.encode({ id: this.id, type: "apiToken" }, 2147483647);
            await super.save();
        }
    };
}
