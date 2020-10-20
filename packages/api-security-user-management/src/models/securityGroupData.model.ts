import KSUID from "ksuid";
import { validation } from "@webiny/validation";
import { compose } from "ramda";
import { withName } from "@commodo/name";
import { withHooks } from "@commodo/hooks";
import { withFields, string, boolean, skipOnPopulate, setOnce } from "@commodo/fields";
import { object } from "commodo-fields-object";

export const PK_GROUP = "G";
export const SK_GROUP = "A";
export const GSI1_PK_GROUP = "GROUP";

export const SecurityGroupData = () =>
    compose(
        withName(PK_GROUP),
        withFields(() => ({
            __type: string({ value: PK_GROUP }),
            id: string({ value: KSUID.randomSync().string }),
            createdOn: compose(
                skipOnPopulate(),
                setOnce()
            )(string({ value: new Date().toISOString() })),
            savedOn: compose(skipOnPopulate())(string({ value: new Date().toISOString() })),
            name: string({ validation: validation.create("required") }),
            slug: string({ validation: validation.create("required") }),
            description: string({ validation: validation.create("required") }),
            system: boolean({ value: false }),
            permissions: object({
                list: true,
                value: []
            })
        })),
        withHooks({
            async beforeSave(parent) {
                const existingGroup = await parent.constructor.findOne({
                    query: { GSI1_PK: GSI1_PK_GROUP, GSI1_SK: `slug#${this.slug}` }
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
    )();
