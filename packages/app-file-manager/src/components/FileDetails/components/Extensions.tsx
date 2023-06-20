import { CmsModel } from "@webiny/app-headless-cms/types";
import React, { useMemo } from "react";
import { ModelProvider } from "@webiny/app-headless-cms/admin/components/ModelProvider";
import { Fields } from "@webiny/app-headless-cms/admin/components/ContentEntryForm/Fields";
import { Bind, Form, useBind } from "@webiny/form";

interface ExtensionsProps {
    model: CmsModel;
}

export const Extensions = ({ model }: ExtensionsProps) => {
    const extensionsField = useMemo(() => {
        return model.fields.find(f => f.fieldId === "extensions");
    }, [model]);

    if (!extensionsField) {
        return null;
    }

    const fields = extensionsField.settings?.fields || [];
    const layout = extensionsField.settings?.layout || [];

    if (!layout.length) {
        layout.push(...fields.map(field => [field.fieldId]));
    }

    const { value, onChange } = useBind({
        name: "extensions"
    });

    return (
        <ModelProvider model={model}>
            <Form data={value} onChange={onChange}>
                {() => (
                    <Fields
                        contentModel={model}
                        Bind={Bind as any}
                        fields={fields}
                        layout={layout}
                    />
                )}
            </Form>
        </ModelProvider>
    );
};
