import React from "react";
import {
    AcoConfig,
    type AdvancedSearchFieldRendererConfig as FieldRendererConfig
} from "@webiny/app-aco";
import { useModel } from "~/admin/components/ModelProvider";

const { AdvancedSearch } = AcoConfig;

export type { FieldRendererConfig };

export interface FieldRendererProps
    extends React.ComponentProps<typeof AcoConfig.AdvancedSearch.FieldRenderer> {
    modelIds?: string[];
}

const BaseFieldRenderer = ({ modelIds = [], ...props }: FieldRendererProps) => {
    const { model } = useModel();

    if (modelIds.length > 0 && !modelIds.includes(model.modelId)) {
        return null;
    }

    return (
        <AcoConfig>
            <AdvancedSearch.FieldRenderer {...props} />
        </AcoConfig>
    );
};

export const FieldRenderer = Object.assign(BaseFieldRenderer, {
    useInputField: AdvancedSearch.FieldRenderer.useInputField,
    FieldType: AdvancedSearch.FieldRenderer.FieldType
});
