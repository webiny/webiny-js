import { flow } from "lodash";
import { withName, ref, string, withFields } from "@webiny/commodo";

export default ({ createBase, SecurityRole }) =>
    flow(
        withName("SecurityRoles2Models"),
        withFields(() => ({
            model: ref({ instanceOf: [], refNameField: "modelClassId" }),
            modelClassId: string(),
            role: ref({
                instanceOf: SecurityRole
            })
        }))
    )(createBase());
