import { createPrivateModel } from "~/plugins";
import { createModelField } from "~/utils/createModelField";

export const articleModel = createPrivateModel({
    titleFieldId: "title",
    name: "Article",
    modelId: "article",
    fields: [
        createModelField({
            label: "Title",
            type: "text",
            fieldId: "title"
        }),
        createModelField({
            label: "Desired Embargo Date",
            type: "datetime",
            fieldId: "desiredEmbargoDate",
            settings: {
                type: "dateTimeWithoutTimezone",
                defaultSetValue: "null"
            }
        }),
        createModelField({
            id: "articleEmbargoDate",
            fieldId: "articleEmbargoDate",
            type: "datetime",
            label: "Embargo Date",
            settings: {
                type: "dateTimeWithoutTimezone",
                defaultSetValue: "null"
            }
        })
    ]
});
