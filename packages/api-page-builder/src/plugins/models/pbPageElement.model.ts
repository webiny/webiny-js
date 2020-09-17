import { flow } from "lodash";
import { validation } from "@webiny/validation";
import content from "./pbPage/contentField";

import { withFields, string, withName, fields, int, boolean } from "@webiny/commodo";
import { float } from "commodo-fields-float";

const PbPageElementPreviewMetaModel = withFields({
    width: int(),
    height: int(),
    aspectRatio: float(),
    private: boolean()
});

const PbPageElementPreviewModel = withFields({
    id: string(),
    __physicalFileName: string(),
    name: string(),
    size: int(),
    type: string(),
    meta: fields({
        instanceOf: PbPageElementPreviewMetaModel()
    })
});

export default ({ createBase, context }) =>
    flow(
        withName("PbPageElement"),
        withFields({
            name: string({ validation: validation.create("required") }),
            category: string(),
            type: string({ validation: validation.create("required,in:element:block") }),
            content: content({ context }),
            preview: fields({
                instanceOf: PbPageElementPreviewModel()
            })
        })
    )(createBase({ maxPerPage: 1000 }));
