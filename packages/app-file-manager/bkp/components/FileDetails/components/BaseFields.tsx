// @ts-nocheck
import React, { useMemo } from "react";
import { CompositionScope } from "@webiny/app-admin";
import type { CmsModel } from "@webiny/app-headless-cms/types.js";
import { ModelProvider } from "@webiny/app-headless-cms/admin/components/ModelProvider/index.js";
import { Fields } from "@webiny/app-headless-cms/admin/components/ContentEntryForm/Fields.js";
import { Bind } from "@webiny/form";

interface BaseFieldsProps {
    model: CmsModel;
}

export const BaseFields = ({ model }: BaseFieldsProps) => {
    const fields = useMemo(() => {
        return model.fields.filter(f => f.fieldId !== "extensions");
    }, [model]);

    return (
        <CompositionScope name={"fm.fileDetails.baseFields"}>
            <ModelProvider model={model}>
                <Fields
                    contentModel={model}
                    /**
                     * TODO: Figure out correct Bind type
                     */
                    // @ts-expect-error
                    Bind={Bind}
                    fields={fields}
                    layout={model.layout || []}
                />
            </ModelProvider>
        </CompositionScope>
    );
};
