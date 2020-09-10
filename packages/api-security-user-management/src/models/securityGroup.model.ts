import { flow } from "lodash";
// import { validation } from "@webiny/validation";
import { withHooks, withName, object, string, boolean, withFields } from "@webiny/commodo";

export default ({ createBase }) => {
    // TODO: fix type when Commodo is migrated to TS
    const SecurityGroup: any = flow(
        withName("SecurityGroup"),
        withFields(() => ({
            description: string(),
            name: string(),
            slug: string(),
            system: boolean(),
            permissions: object({
                list: true,
                value: [],
                // TODO: add a custom validation
            })
        })),
        withHooks({
            async beforeCreate() {
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
