// @flow
import { flow } from "lodash";
import { withFields } from "@commodo/fields";
import { string } from "@commodo/fields/fields";
import { ref } from "@commodo/fields-storage-ref";
import { withName } from "@commodo/name";

export default ({ createBase, SecurityRole }) =>
    flow(
        withName("SecurityRoles2Models"),
        withFields(() => ({
            entity: ref({ instanceOf: [], refNameField: "entityClassId" }),
            entityClassId: string(),
            role: ref({
                instanceOf: SecurityRole
            })
        }))
    )(createBase());
