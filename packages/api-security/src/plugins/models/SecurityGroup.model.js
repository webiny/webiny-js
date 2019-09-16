// @flow
import { flow } from "lodash";
import { withFields, setOnce } from "@commodo/fields";
import { string, boolean } from "@commodo/fields/fields";
import { ref } from "@commodo/fields-storage-ref";
import { withName } from "@commodo/name";
import { withHooks } from "@commodo/hooks";
import { validation } from "@webiny/validation";
import withStorage from "./withStorage";

export default config => ({ getModel, getUser }) =>
    flow(
        withStorage(config),
        withName("SecurityGroup"),
        withFields(() => ({
            createdBy: string(),
            description: string(),
            system: boolean(),
            roles: ref({
                list: true,
                instanceOf: [getModel("SecurityRole"), "entity"],
                using: [getModel("SecurityRoles2Models"), "role"]
            })
        })),
        withHooks({
            async beforeCreate() {
                if (getUser()) {
                    this.createdBy = getUser().id;
                }

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
        })
    )();
