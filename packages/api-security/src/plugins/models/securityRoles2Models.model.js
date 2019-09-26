// @flow
import { flow } from "lodash";
import { withName, ref, string, withFields } from "@webiny/commodo";

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
