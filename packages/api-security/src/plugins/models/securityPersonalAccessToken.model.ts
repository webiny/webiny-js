import { withFields, withName, string, ref } from "@webiny/commodo";
import { flow } from "lodash";
import { validation } from "@webiny/validation";

export default ({ createBase, context }) =>
    flow(
        withName("SecurityPersonalAccessToken"),
        withFields(() => ({
            name: string({ validation: validation.create("required,maxLength:100") }),
            token: string({ validation: validation.create("required,maxLength:64") }),
            user: ref({
                instanceOf: context.models.SecurityUser,
                validation: validation.create("required"),
            }),
        }))
    )(createBase());
