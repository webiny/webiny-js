import React, { useMemo } from "react";

import type { AdvancedSearchProps } from "./AdvancedSearch.js";
import { AdvancedSearch as AdvancedSearchComponent } from "./AdvancedSearch.js";
import { AdvancedSearchConfigs } from "./AdvancedSearchConfigs.js";

export * from "./GraphQLInputMapper.js";
export * from "./gateways/index.js";
import type { FieldRaw } from "./domain/index.js";
import { Field, FieldMapper } from "./domain/index.js";
import type { FieldRendererConfig } from "~/config/advanced-search/FieldRenderer.js";
export * from "./useFilterRepository.js";
export * from "./useInputField.js";

interface AdvancedSearchWithFieldRenderersProps extends Omit<AdvancedSearchProps, "fields"> {
    fieldRenderers: FieldRendererConfig[];
    fields: FieldRaw[];
}

const AdvancedSearchWithFieldRenderers = ({
    fieldRenderers,
    fields,
    ...props
}: AdvancedSearchWithFieldRenderersProps) => {
    const fieldsWithRenderer = useMemo(() => {
        const fieldDTOs = FieldMapper.toDTO(fields.map(field => Field.createFromRaw(field)));

        return fieldDTOs.map(field => {
            const config = fieldRenderers.find(config => config.type === field.type);
            const element = config?.element ?? null;
            return { ...field, element };
        });
    }, [fields]);

    return <AdvancedSearchComponent {...props} fields={fieldsWithRenderer} />;
};

export const AdvancedSearch = (props: AdvancedSearchWithFieldRenderersProps) => {
    return (
        <>
            <AdvancedSearchWithFieldRenderers {...props} />
            <AdvancedSearchConfigs />
        </>
    );
};
