import React, { useCallback, useMemo } from "react";
import { BindComponentRenderProp, CmsModelField } from "~/types";
import { CmsReferenceValue } from "~/admin/plugins/fieldRenderers/ref/components/types";
import { useContentModels } from "./useContentModels";
import { useReferences } from "./useReferences";
import { AddItemParams, RemoveItemParams, SimpleItems } from "./SimpleItems";

interface SimpleMultipleRendererProps {
    bind: BindComponentRenderProp<CmsReferenceValue[] | undefined | null>;
    field: CmsModelField;
}

export const SimpleMultipleRenderer = (props: SimpleMultipleRendererProps) => {
    const { field, bind } = props;

    const values = useMemo(() => {
        return Array.isArray(bind.value) ? bind.value : [];
    }, [bind.value]);

    const { models } = useContentModels({
        field
    });

    const references = useReferences({
        models
    });

    const addItem = useCallback(
        (params: AddItemParams) => {
            bind.onChange([...values, params]);
        },
        [bind, values]
    );
    const removeItem = useCallback(
        ({ entryId }: RemoveItemParams) => {
            bind.onChange(
                values.filter(value => {
                    if (!value?.id) {
                        return false;
                    }
                    return value.id.substring(0, entryId.length) !== entryId;
                })
            );
        },
        [bind, values]
    );

    return (
        <SimpleItems
            multiple={true}
            field={field}
            values={values}
            items={references.entries}
            addItem={addItem}
            removeItem={removeItem}
        />
    );
};
