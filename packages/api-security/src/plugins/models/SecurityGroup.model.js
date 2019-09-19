// @flow
import { flow } from "lodash";
import { withFields } from "@commodo/fields";
import { string, boolean } from "@commodo/fields/fields";
import { ref } from "@commodo/fields-storage-ref";
import { withName } from "@commodo/name";
import { withHooks } from "@commodo/hooks";

export default ({ createBase, SecurityRole, SecurityRoles2Models }) => {
    const SecurityGroup = flow(
        withName("SecurityGroup"),
        withFields(() => ({
            createdBy: string(),
            description: string(),
            name: string(),
            slug: string(),
            system: boolean(),
            roles: ref({
                list: true,
                instanceOf: [SecurityRole, "entity"],
                using: [SecurityRoles2Models, "role"]
            })
        })),
        withHooks({
            async beforeCreate() {
                this.createdBy = this.getUserId();

                const existingGroup = await SecurityGroup.findOne({
                    query: { slug: this.slug }
                });
                if (existingGroup) {
                    throw Error(`Group with slug "${this.slug}" already exists.`);
                }
            },
            async beforeDelete() {
                if (this.system) {
                    throw Error(`Cannot delete system group.`);
                }
            }
        })
    )(createBase());

    return SecurityGroup;
};
