import { flow } from "lodash";
// @ts-ignore
import { withFields, withName, string, float } from "@webiny/commodo";

export default ({ createBase }) =>
    flow(
        withName("Unicorn"),
        withFields(() => ({
            name: string(),
            weight: float()
        }))
    )(createBase());
