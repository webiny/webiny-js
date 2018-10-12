// @flow
import md5 from "md5";
import bcrypt from "bcryptjs";
import { Entity } from "webiny-entity";
import type { Group } from "./Group.entity";
import type { Role } from "./Role.entity";
import FileModel from "./File.model";
import { loadEntityScopes } from "./utils";

export class User extends Entity {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    gravatar: string;
    avatar: Object;
    enabled: boolean;
    groups: Promise<Array<Group>>;
    roles: Promise<Array<Role>>;
    scopes: Promise<Array<string>>;
}

User.classId = "SecurityUser";
User.storageClassId = "Security_Users";

export function userFactory({ entities }: Object) {
    return class extends User {
        constructor() {
            super();
            this.attr("email")
                .char()
                .setValidators("required,email")
                .onSet(value => {
                    if (value !== this.email) {
                        this.on("beforeSave", async () => {
                            const existingUser = await User.findOne({ query: { email: value } });
                            if (existingUser) {
                                throw Error("User with given e-mail already exists.");
                            }
                        }).setOnce();
                    }

                    return value.toLowerCase().trim();
                });

            this.attr("password")
                .char()
                .setValidators("required")
                .onSet(value => {
                    if (value) {
                        return bcrypt.hashSync(value, bcrypt.genSaltSync(10));
                    }
                    return this.password;
                });
            this.attr("firstName").char();
            this.attr("lastName").char();
            this.attr("fullName")
                .char()
                .setDynamic(() => {
                    return `${this.firstName} ${this.lastName}`.trim();
                });

            this.attr("avatar").model(FileModel);

            this.attr("gravatar")
                .char()
                .setDynamic(() => "https://www.gravatar.com/avatar/" + md5(this.email));

            this.attr("enabled")
                .boolean()
                .setValue(true);

            this.attr("roles")
                .entities(entities.Role, "entity")
                .setUsing(entities.Roles2Entities, "role");

            this.attr("groups")
                .entities(entities.Group, "entity")
                .setUsing(entities.Groups2Entities, "group");

            this.attr("scopes").array().setDynamic(() => {
                return loadEntityScopes.call(this);
            });
        }
    };
}
