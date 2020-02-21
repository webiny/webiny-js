import { flow } from "lodash";
import { validation } from "@webiny/validation";
import { withFields, string, withName } from "@webiny/commodo";
import { any } from "./anyField";

const required = validation.create("required");

export default ({ createBase }) => {
    return flow(
        withName("CmsFieldValue"),
        withFields({
            locale: string({ validation: required }),
            field: string({ validation: required }),
            value: any(),
            ref: string({ validation: required }),
            modelId: string({ validation: required }),
            modelName: string({ validation: required })
        })
    )(createBase());
};

// {
//     "_id" : ObjectId("5e4d31e8514a174a7432d954"),
//     "locale" : "en-US",
//     "field" : "title",
//     "value" : "Ambulancewagen",
//     "ref" : "ID#12345678",
//     "modelId" : "category",
//     "modelName" : "Category"
// }
