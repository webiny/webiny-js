import { useBind } from "@webiny/form";
import { useModel, useModelField, useParentField } from "@webiny/app-headless-cms";
import { useFieldTracker } from "./FieldTracker";
import { useEffect } from "react";

export const DecorateContentEntryFormBind = useBind.createDecorator(baseHook => {
    const seoFields = ["seoTitle", "seoDescription", "seoMetaTags"];

    return params => {
        try {
            const { trackField } = useFieldTracker();

            const { field } = useModelField();
            const parent = useParentField();

            const { model } = useModel();
            if (model.modelId !== "article") {
                return baseHook(params);
            }

            const bind = baseHook(params);

            useEffect(() => {
                if (field.type === "rich-text") {
                    trackField(field.label, field.type, params.name, bind.value, bind.onChange);
                }

                if (seoFields.includes(field.fieldId) && !parent) {
                    trackField(field.label, field.fieldId, params.name, bind.value, bind.onChange);
                }
            }, [bind.value]);

            return bind;
        } catch {
            return baseHook(params);
        }
    };
});
