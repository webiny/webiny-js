import md5 from "md5";
import merge from "merge";
import { pipe } from "@webiny/commodo";
import { validation } from "@webiny/validation";
import {
    withHooks,
    withProps,
    withName,
    string,
    withFields,
    onSet,
    ref,
    skipOnPopulate
} from "@webiny/commodo";

export default ({ createBase, context }): any => {
    const SecurityUser: any = pipe(
        withName("SecurityUser"),
        withHooks(),
        withFields(instance => ({
            email: onSet(value => {
                if (value === instance.email) {
                    return value;
                }

                value = value.toLowerCase().trim();
                const removeCallback = instance.hook("beforeSave", async () => {
                    removeCallback();
                    const existingUser = await SecurityUser.findOne({
                        query: { email: value }
                    });
                    if (existingUser) {
                        throw Error("User with given e-mail already exists.");
                    }
                });

                return value;
            })(
                string({
                    validation: validation.create("required")
                })
            ),
            firstName: string(),
            lastName: string(),
            groups: ref({
                list: true,
                instanceOf: [context.models.SecurityGroup, "model"],
                using: [context.models.SecurityGroups2Models, "group"]
            }),
            avatar: context.commodo.fields.id(),
            personalAccessTokens: skipOnPopulate()(
                ref({
                    list: true,
                    instanceOf: [context.models.SecurityPersonalAccessToken, "user"]
                })
            )
        })),
        withProps(instance => ({
            __permissions: null,
            get fullName() {
                return `${instance.firstName} ${instance.lastName}`.trim();
            },
            get gravatar() {
                return "https://www.gravatar.com/avatar/" + md5(instance.email);
            },
            get permissions() {
                if (this.__permissions) {
                    return this.__permissions;
                }

                return new Promise(async resolve => {
                    const allPermissions = [];

                    const permissions = [];
                    const groups = await this.groups;
                    // Get permissions via `groups` relation
                    for (let i = 0; i < groups.length; i++) {
                        const permissionsFromGroup = await groups[i].permissions;
                        for (let j = 0; j < permissionsFromGroup.length; j++) {
                            permissions.push(permissionsFromGroup[j]);
                        }
                    }

                    permissions.forEach(perm => {
                        const permIndex = allPermissions.findIndex(p => p.name === perm.name);

                        if (permIndex === -1) {
                            allPermissions.push(perm);
                        } else {
                            allPermissions[permIndex] = merge.recursive(
                                false,
                                permissions[permIndex],
                                perm
                            );
                        }
                    });

                    this.__permissions = allPermissions;

                    resolve(this.__permissions);
                });
            }
        }))
    )(createBase());

    return SecurityUser;
};
