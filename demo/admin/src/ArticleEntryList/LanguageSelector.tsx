import React from "react";
import { useBind } from "@webiny/form";
import { validation } from "@webiny/validation";
import { FormElementMessage } from "@webiny/ui/FormElementMessage";
import { ModelProvider, useModel } from "@webiny/app-headless-cms";
import { SimpleSingleRenderer } from "@webiny/app-headless-cms/admin/plugins/fieldRenderers/ref/simple/components/SimpleSingleRenderer";
import { ModelFieldProvider } from "@webiny/app-headless-cms/admin/components/ModelFieldProvider";
import { CmsModelField } from "@webiny/app-headless-cms/types";

export const LanguageSelector = () => {
    const { model } = useModel();
    const field = model.fields.find(field => field.fieldId === "language");

    if (!field) {
        return <div>Field &quote;region&quote; does not exist!</div>;
    }

    return (
        <ModelProvider model={model}>
            <ModelFieldProvider field={field}>
                <>
                    <p>Select a language to translate to:</p>
                    <LanguageDropdown field={field} />
                </>
            </ModelFieldProvider>
        </ModelProvider>
    );
};

interface LanguageDropdownProps {
    field: CmsModelField;
}

const LanguageDropdown = ({ field }: LanguageDropdownProps) => {
    const bind = useBind({
        name: "language",
        validators: [validation.create("required")]
    });

    return (
        <>
            <SimpleSingleRenderer field={{ ...field, label: "" }} bind={bind} />
            {bind.validation.isValid === false && (
                <FormElementMessage error>{bind.validation.message}</FormElementMessage>
            )}
        </>
    );
};
