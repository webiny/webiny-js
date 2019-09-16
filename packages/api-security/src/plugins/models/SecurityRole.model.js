// @flow
import { flow } from "lodash";
import { withFields, setOnce } from "@commodo/fields";
import { string, boolean } from "@commodo/fields/fields";
import { withName } from "@commodo/name";
import { withHooks } from "@commodo/hooks";
import { validation } from "@webiny/validation";
import withStorage from "./withStorage";

export default config => ({ getModel, getUser }) =>
    flow(
        withStorage(config),
        withName("SecurityRole"),
        withFields({
            createdBy: string(),
            description: string(),
            system: boolean(),
            scopes: string({ list: true })
        }),
        withHooks({
            async beforeCreate() {
                if (getUser()) {
                    this.createdBy = getUser().id;
                }
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
        })
    )();
