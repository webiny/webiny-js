// @flow
import { flow } from "lodash";
import { withName, ref, string, withFields } from "@webiny/commodo";

export default ({ createBase, SecurityGroup }) =>
    flow(
        withName("SecurityGroups2Models"),
        withFields(() => ({
            entity: ref({ instanceOf: [], refNameField: "entityClassId" }),
            entityClassId: string(),
            group: ref({
                instanceOf: SecurityGroup
            })
        }))
    )(createBase());
