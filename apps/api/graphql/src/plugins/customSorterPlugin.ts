// there is a class and a function so users can use whatever suits their way of writing code
import { createCmsGraphQLSchemaSorterPlugin } from "@webiny/api-headless-cms";

import { createCmsEntryFieldSortingPlugin } from "@webiny/api-headless-cms-ddb";

export const customSorterPlugin = createCmsGraphQLSchemaSorterPlugin(({ sorters, model }) => {
    // we only want to add the sorter when generating a certain model GraphQL Schema
    if (model.modelId !== "article") {
        return sorters;
    }
    return [...sorters, "articleAuditStatus_ASC", "articleAuditStatus_DESC"];
});

export const customSortingPlugin = createCmsEntryFieldSortingPlugin({
    canUse: ({ fieldId, model }) => {
        return model.modelId === "article" && fieldId === "articleAuditStatus";
    },
    createSort: ({ fields, order }) => {
        // let's find the field we want to sort by
        // you can find the field by joining all its parents fieldId + the fieldId you want to sort by via a dot (.)
        // this is the information user must know (possibly they can create a finder for the field)
        const fieldId = "articleAudit.status"; // the fieldId is later on used in error report - if any
        const field = fields[fieldId];
        // we can create a field path via the built-in method
        const valuePath = field.createPath({
            field
        });

        return {
            field,
            fieldId,
            valuePath,
            reverse: order === "DESC"
        };
    }
});
