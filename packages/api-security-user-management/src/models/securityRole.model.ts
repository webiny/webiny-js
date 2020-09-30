import { flow } from "lodash";
import { withHooks, withName, string, boolean, withFields, createField } from "@webiny/commodo";

export const any = (options = {}) => {
    return createField({ ...options, type: "any" });
};

export default ({ createBase }) => {
    const SecurityRole: any = flow(
        withName("SecurityRole"),
        withFields({
            name: string(),
            slug: string(),
            description: string(),
            system: boolean(),
            permissions: any({ list: true })
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
