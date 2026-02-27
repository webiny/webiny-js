import React, { useMemo } from "react";
import type { BindComponentRenderProp, CmsModelField } from "~/types.js";
import type { CmsReferenceValue } from "~/admin/plugins/fieldRenderers/ref/components/types.js";
import { useContentModels } from "./useContentModels.js";
import { useReferences } from "./useReferences.js";
import { Loader } from "~/admin/plugins/fieldRenderers/ref/simple/components/Loader.js";
import { RadioGroup } from "@webiny/admin-ui";
import { useModelField } from "@webiny/app-headless-cms-common";

interface SimpleSingleRendererProps {
    bind: BindComponentRenderProp<CmsReferenceValue | undefined | null>;
    field: CmsModelField;
}

export const SimpleSingleRenderer = (props: SimpleSingleRendererProps) => {
    const { bind } = props;

    const { field, permissions } = useModelField();

    const value = useMemo(() => {
        return bind.value?.id;
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
        <RadioGroup
            {...bind}
            disabled={!permissions.canEdit}
            label={field.label}
            description={field.description}
            note={field.note}
            hint={field.help}
            value={value}
            items={items}
            onChange={(value: string) => {
                const selectedItem = references.entries.find(
                    entry => entry.entryId === value.split("#")[0]
                );

                if (!selectedItem) {
                    return;
                }

                bind.onChange({
                    id: selectedItem.id,
                    modelId: selectedItem.model.modelId
                });
            }}
        />
    );
};
