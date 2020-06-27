import { flow } from "lodash";
import { validation } from "@webiny/validation";

import { withFields, string, withHooks, withName } from "@webiny/commodo";

import { PbContext } from "@webiny/api-page-builder/types";

export default ({ createBase, context } : { createBase: Function, context: PbContext }) =>
    flow(
        withName("PbCategory"),
        withHooks({
            async beforeDelete() {
                const { PbPage } = context.models[this.modelId];
                if (await PbPage.findOne()) {
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
