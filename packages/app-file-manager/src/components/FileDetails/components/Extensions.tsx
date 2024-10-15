import styled from "@emotion/styled";
import React, { useMemo } from "react";
import { CompositionScope } from "@webiny/app-admin";
import { CmsModel } from "@webiny/app-headless-cms/types";
import { ModelProvider } from "@webiny/app-headless-cms/admin/components/ModelProvider";
import { Fields } from "@webiny/app-headless-cms/admin/components/ContentEntryForm/Fields";
import { Bind, BindPrefix } from "@webiny/form";

const HideEmptyCells = styled.div`
    .mdc-layout-grid__cell:empty {
        display: none;
    }
`;

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

    return (
        <CompositionScope name={"fm.fileDetails.extensionFields"}>
            <ModelProvider model={model}>
                <BindPrefix name={"extensions"}>
                    <HideEmptyCells>
                        <Fields
                            contentModel={model}
                            // @ts-expect-error
                            Bind={Bind}
                            fields={fields}
                            layout={layout}
                        />
                    </HideEmptyCells>
                </BindPrefix>
            </ModelProvider>
        </CompositionScope>
    );
};
