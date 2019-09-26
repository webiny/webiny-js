// @flow
import { flow } from "lodash";
import { withHooks, withName, string, boolean, withFields } from "@webiny/commodo";

export default ({ createBase }) => {
    const SecurityRole = flow(
        withName("SecurityRole"),
        withFields({
            name: string(),
            slug: string(),
            description: string(),
            system: boolean(),
            scopes: string({ list: true })
        }),
        withHooks({
            async beforeCreate() {
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
