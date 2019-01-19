// @flow
import md5 from "md5";
import bcrypt from "bcryptjs";
import { get } from "lodash";
import { Entity } from "webiny-entity";
import type { Group } from "./Group.entity";
import type { Role } from "./Role.entity";
import FileModel from "./File.model";

type AccessType = {
    scopes: Array<string>,
    roles: Array<string>,
    fullAccess: boolean
};

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
    access: Promise<AccessType>;
}

User.classId = "SecurityUser";
User.storageClassId = "Security_Users";

export function userFactory({ config, security: { entities } }: Object) {
    return class extends User {
        __access: ?AccessType;
        constructor() {
            super();
            // Once we load access attribute, we cache it here.
            this.__access = null;

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

            /**
             * Returns all scopes and roles.
             */
            this.attr("access")
                .object()
                .setDynamic(async () => {
                    if (get(config, "security.enabled") === false) {
                        return {
                            scopes: [],
                            roles: [],
                            fullAccess: true
                        };
                    }

                    if (this.__access) {
                        return this.__access;
                    }

                    const access = {
                        scopes: [],
                        roles: [],
                        fullAccess: false
                    };

                    const groups = await this.groups;
                    // Get scopes via `groups` relation
                    for (let i = 0; i < groups.length; i++) {
                        const group = groups[i];
                        const roles = await group.roles;
                        for (let j = 0; j < roles.length; j++) {
                            const role = roles[j];
                            !access.roles.includes(role.slug) && access.roles.push(role.slug);
                            role.scopes.forEach(scope => {
                                !access.scopes.includes(scope) && access.scopes.push(scope);
                            });
                        }
                    }

                    // Get scopes via `roles` relation
                    const roles = await this.roles;
                    for (let j = 0; j < roles.length; j++) {
                        const role = roles[j];
                        !access.roles.includes(role.slug) && access.roles.push(role.slug);
                        role.scopes.forEach(scope => {
                            !access.scopes.includes(scope) && access.scopes.push(scope);
                        });
                    }

                    // If full access, no need to send any scopes / roles.
                    access.fullAccess = access.roles.includes("full-access");
                    if (access.fullAccess) {
                        access.scopes = [];
                        access.roles = [];
                    }

                    this.__access = access;

                    return access;
                });
        }
    };
}
