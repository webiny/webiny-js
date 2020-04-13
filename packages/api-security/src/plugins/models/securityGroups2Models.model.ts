import { flow } from "lodash";
import { withName, ref, string, withFields } from "@webiny/commodo";

export default ({ createBase, context }) =>
    flow(
        withName("SecurityGroups2Models"),
        withFields(() => ({
            model: ref({ instanceOf: [], refNameField: "modelName" }),
            modelName: string(),
            group: ref({
                instanceOf: context.models.SecurityGroup
            })
        }))
    )(createBase());
