// @flow
import { Entity } from "webiny-entity";
import { JwtToken } from "../security/jwtToken";
import type { Group } from "./Group.entity";
import type { Role } from "./Role.entity";
import { loadEntityScopes } from "./utils";

export class ApiToken extends Entity {
    name: string;
    description: string;
    token: string;
    groups: Promise<Array<Group>>;
    roles: Promise<Array<Role>>;
    scopes: Promise<Array<string>>;
}

ApiToken.classId = "SecurityApiToken";
ApiToken.storageClassId = "Security_ApiTokens";

export function apiTokenFactory({ user = {}, config, entities }: Object): Class<ApiToken> {
    return class extends ApiToken {
        constructor() {
            super();
            this.attr("createdBy")
                .char()
                .setDefaultValue(user.id);
            this.attr("name").char();
            this.attr("description").char();
            this.attr("token")
                .char()
                .setValidators();

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

            this.on("afterCreate", () => this.activate());
        }

        async activate(): Promise<ApiToken> {
            const token = new JwtToken({ secret: config.security.token.secret });
            this.token = await token.encode(
                { id: this.id, type: "token", scopes: await this.scopes },
                // 2147483647 = maximum value of unix timestamp (year 2038).
                2147483647
            );
            await this.save();
            return this;
        }
    };
}
