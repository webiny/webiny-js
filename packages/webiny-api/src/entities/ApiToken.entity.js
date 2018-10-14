// @flow
import { Entity } from "webiny-entity";
import { JwtToken } from "../security/jwtToken";
import type { Group } from "./Group.entity";
import type { Role } from "./Role.entity";
import { loadEntityScopes } from "./utils";

export interface IApiToken {
    name: string;
    token: string;
    description: string;
    groups: Promise<Array<Group>>;
    roles: Promise<Array<Role>>;
    scopes: Promise<Array<string>>;
    createJWT(): Promise<IApiToken>;
}

export function apiTokenFactory({ user = {}, config, entities }: Object): Class<IApiToken> {
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

        async createJWT(): Promise<IApiToken> {
            // 2147483647 = maximum value of unix timestamp (year 2038).
            const token = new JwtToken({ secret: config.security.token.secret });
            this.token = await token.encode({ id: this.id, type: "apiToken" }, 2147483647);
            await this.save();
            return this;
        }

        async save(...args): Promise<void> {
            const createToken = !this.isExisting();
            await super.save(...args);

            if (createToken) {
                await this.createJWT();
            }
        }
    };
}
