import React, { useCallback, useMemo } from "react";
import { BindComponentRenderProp, CmsModelField } from "~/types";
import { CmsReferenceValue } from "~/admin/plugins/fieldRenderers/ref/components/types";
import { useContentModels } from "./useContentModels";
import { useReferences } from "./useReferences";
import { AddItemParams, SimpleItems } from "./SimpleItems";

interface SimpleSingleRendererProps {
    bind: BindComponentRenderProp<CmsReferenceValue | undefined | null>;
    field: CmsModelField;
    loadingElement?: JSX.Element;
}

export const SimpleSingleRenderer = (props: SimpleSingleRendererProps) => {
    const { field, bind } = props;

    const value = useMemo(() => {
        return bind.value;
    }, [bind.value]);

    const { models } = useContentModels({
        field
    });

    const references = useReferences({
        models
    });

    const addItem = useCallback(
        (params: AddItemParams) => {
            bind.onChange(params);
        },
        [bind, value]
    );
    const removeItem = useCallback(() => {
        bind.onChange(null);
    }, [bind, value]);

    if (references.loading && props.loadingElement) {
        return props.loadingElement;
    }

    return (
        <SimpleItems
            field={field}
            values={value ? [value] : []}
            items={references.entries}
            addItem={addItem}
            removeItem={removeItem}
        />
    );
};
