// @flow
import compose from "lodash/fp/compose";
import { validation } from "webiny-validation";
import { withName } from "@commodo/name";
import { withHooks } from "@commodo/hooks";
import { ref } from "@commodo/fields-storage-ref";

import { withFields, string, setOnce, boolean } from "@commodo/fields";

export const SecurityGroup = ({ Model, getModel }: Object) =>
    compose(
        withHooks({
            async beforeCreate() {
                const existingGroup = await getModel("SecurityGroup").findOne({
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
        }),
        withFields({
            name: string({ validation: validation.create("required") }),
            slug: setOnce()(string({ validation: validation.create("required") })),
            description: string(),
            system: boolean(),
            roles: ref({
                list: true,
                instanceOf: [getModel("SecurityRole"), "entity"],
                using: [getModel("SecurityRoles2Entities"), "role"]
            })
        }),
        withName("SecurityGroup")
    )(Model);
