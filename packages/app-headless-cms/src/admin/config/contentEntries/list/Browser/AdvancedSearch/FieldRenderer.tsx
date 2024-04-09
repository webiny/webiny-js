import React from "react";
import { CompositionScope } from "@webiny/react-composition";
import {
    AcoConfig,
    AdvancedSearchFieldRendererConfig as FieldRendererConfig
} from "@webiny/app-aco";
import { useModel } from "~/admin/components/ModelProvider";

const { AdvancedSearch } = AcoConfig;

export { FieldRendererConfig };

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
        <CompositionScope name={"cms"}>
            <AcoConfig>
                <AdvancedSearch.FieldRenderer {...props} />
            </AcoConfig>
        </CompositionScope>
    );
};

export const FieldRenderer = Object.assign(BaseFieldRenderer, {
    useInputField: AdvancedSearch.FieldRenderer.useInputField,
    FieldType: AdvancedSearch.FieldRenderer.FieldType
});
