// @flow
import md5 from "md5";
import bcrypt from "bcryptjs";
import get from "lodash/get";
import FileModel from "./File.model";
import compose from "lodash/fp/compose";
import { validation } from "webiny-validation";
import { withName } from "@commodo/name";
import { ref } from "@commodo/fields-storage-ref";
import { withProps } from "repropose";

import { withFields, string, onSet, boolean, fields } from "@commodo/fields";

export const SecurityUser = ({ Model, getModel, config }) =>
    compose(
        withProps({
            __access: null,
            get fullName() {
                return `${this.firstName} ${this.lastName}`.trim();
            },
            get gravatar() {
                return "https://www.gravatar.com/avatar/" + md5(this.email);
            },
            get access() {
                return new Promise(async resolve => {
                    if (get(config, "security.enabled") === false) {
                        return resolve({
                            scopes: [],
                            roles: [],
                            fullAccess: true
                        });
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
        }),
        withFields(instance => ({
            avatar: fields({ instanceOf: FileModel }),
            firstName: string(),
            lastName: string(),
            password: onSet(value => {
                if (value) {
                    return bcrypt.hashSync(value, bcrypt.genSaltSync(10));
                }

                return instance.password;
            })(string({ validation: "required" })),
            enabled: boolean({ value: true }),
            groups: ref({
                list: true,
                instanceOf: [getModel("SecurityGroup"), "entity"],
                using: [getModel("SecurityGroups2Entities"), "group"]
            }),
            roles: ref({
                list: true,
                instanceOf: [getModel("SecurityRole"), "entity"],
                using: [getModel("SecurityRoles2Entities"), "role"]
            }),
            email: onSet(value => {
                if (value === instance.email) {
                    return value;
                }

                value = value.toLowerCase().trim();
                instance.registerHookCallback("beforeSave", async () => {
                    const existingUser = await getModel("SecurityUser").findOne({
                        query: { email: value }
                    });
                    if (existingUser) {
                        throw Error("User with given e-mail already exists.");
                    }
                });
                // TODO .setOnce();

                return value;
            })(string({ validation: validation.create("required,email") }))
        })),
        withName("SecurityUser")
    )(Model);
