// @flow
import compose from "lodash/fp/compose";
import { validation } from "webiny-validation";
import { withName } from "@commodo/name";
import { withHooks } from "@commodo/hooks";

import { withFields, string, setOnce, boolean } from "@commodo/fields";

export const SecurityRole = ({ Model, getModel }) =>
    compose(
        withHooks({
            async beforeCreate() {
                const existingRole = await getModel("SecurityRole").findOne({
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
        }),
        withFields({
            name: string({ validation: validation.create("required") }),
            slug: setOnce()(string({ validation: validation.create("required") })),
            description: string(),
            scopes: string({ list: true }),
            system: boolean()
        }),
        withName("SecurityRole")
    )(Model);
