// @flow
import { flow } from "lodash";
import { withFields } from "@commodo/fields";
import { string, boolean } from "@commodo/fields/fields";
import { withName } from "@commodo/name";
import { withHooks } from "@commodo/hooks";

export default ({ createBase }) => {
    const SecurityRole = flow(
        withName("SecurityRole"),
        withFields({
            createdBy: string(),
            name: string(),
            slug: string(),
            description: string(),
            system: boolean(),
            scopes: string({ list: true })
        }),
        withHooks({
            async beforeCreate() {
                this.createdBy = this.getUserId();

                const existingRole = await SecurityRole.findOne({
                    query: { slug: this.slug }
                });
                if (existingRole) {
                    throw Error(`Role with slug "${this.slug}" already exists.`);
                }
            },
            async beforeDelete() {
                if (this.system) {
                    throw Error(`Cannot delete system role.`);
                }
            }
        })
    )(createBase());

    return SecurityRole;
};
