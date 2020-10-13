import { compose } from "ramda";
import { withName } from "@commodo/name";
import { withFields, string } from "@commodo/fields";

export const PK_DEFAULT_LOCALE = "L#D";

export const DefaultLocaleData = compose(
    withName(PK_DEFAULT_LOCALE),
    withFields({
        __type: string({ value: PK_DEFAULT_LOCALE }),
        code: string(),
        setOn: string({ value: new Date().toISOString() })
    })
)();
