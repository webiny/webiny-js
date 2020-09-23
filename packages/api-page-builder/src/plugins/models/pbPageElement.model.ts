import { validation } from "@webiny/validation";
import content from "./pbPage/contentField";
import { withFields, string, withName, fields, pipe } from "@webiny/commodo";
import PbImageFieldModel from "./pbImageField.model";

export default ({ createBase, context }) =>
    pipe(
        withName("PbPageElement"),
        withFields({
            name: string({ validation: validation.create("required") }),
            category: string(),
            type: string({ validation: validation.create("required,in:element:block") }),
            content: content({ context }),
            preview: fields({
                value: null,
                instanceOf: PbImageFieldModel()
            })
        })
    )(createBase({ maxPerPage: 1000 }));
