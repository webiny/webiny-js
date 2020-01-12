import { flow } from "lodash";
import { withName, ref, string, withFields } from "@webiny/commodo";

export default ({ createBase, SecurityGroup }) =>
    flow(
        withName("SecurityGroups2Models"),
        withFields(() => ({
            model: ref({ instanceOf: [], refNameField: "modelName" }),
            modelName: string(),
            group: ref({
                instanceOf: SecurityGroup
            })
        }))
    )(createBase());
