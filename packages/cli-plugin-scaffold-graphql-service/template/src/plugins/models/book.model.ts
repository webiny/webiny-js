// @ts-ignore
import { withFields, withName, string, pipe } from "@webiny/commodo";

export default ({ createBase }) =>
    pipe(
        withName("Book"),
        withFields(() => ({
            title: string()
        }))
    )(createBase());
