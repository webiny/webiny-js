import { flow } from "lodash";
import { validation } from "@webiny/validation";

import { withFields, string, withName } from "@webiny/commodo";

export default ({ createBase }) =>
    flow(
        withName("PbCategory"),
        withHooks({
            async beforeDelete() {
                const Model = context.models[this.modelId];
                if (await Model.findOne()) {
                    throw new Error(
                        "Cannot delete category because some pages are linked to it."
                    );
                }
            }
        }),
        withFields({
            name: string({ validation: validation.create("required") }),
            slug: string({ validation: validation.create("required") }),
            url: string({ validation: validation.create("required") }),
            layout: string()
        })
    )(createBase());
