import React, { useMemo } from "react";
import type { BindComponentRenderProp, CmsModelField } from "~/types.js";
import type { CmsReferenceValue } from "~/admin/plugins/fieldRenderers/ref/components/types.js";
import { useContentModels } from "./useContentModels.js";
import { useReferences } from "./useReferences.js";
import { CheckboxGroup } from "@webiny/admin-ui";
import { Loader } from "./Loader.js";

interface SimpleMultipleRendererProps {
    bind: BindComponentRenderProp<CmsReferenceValue[] | undefined | null>;
    field: CmsModelField;
}

export const SimpleMultipleRenderer = (props: SimpleMultipleRendererProps) => {
    const { field, bind } = props;

    const values = useMemo(() => {
        return Array.isArray(bind.value) ? bind.value.map(item => item.id) : [];
    }, [bind.value]);

    const { models } = useContentModels({
        field
    });

    const references = useReferences({
        models
    });

    const items = useMemo(() => {
        if (!references.entries) {
            return [];
        }

        return references.entries.map(entry => ({
            label: entry.title,
            value: entry.id
        }));
    }, [references]);

    if (references.loading) {
        return <Loader />;
    }

    return (
        <CheckboxGroup
            {...bind}
            label={field.label}
            description={field.description}
            value={values}
            items={items}
            onChange={(values: string[]) => {
                const selectedEntryIds = values.map(value => value.split("#")[0]);
                const selectedItems = references.entries.filter(entry =>
                    selectedEntryIds.includes(entry.entryId)
                );

                bind.onChange(
                    selectedItems.map(({ id, model }) => ({
                        id,
                        modelId: model.modelId
                    }))
                );
            }}
        />
    );
};
