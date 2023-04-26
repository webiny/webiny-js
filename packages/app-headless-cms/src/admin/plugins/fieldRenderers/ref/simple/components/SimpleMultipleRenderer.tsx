import React, { useCallback, useMemo } from "react";
import { BindComponentRenderProp, CmsModelField } from "~/types";
import { CmsReferenceValue } from "~/admin/plugins/fieldRenderers/ref/components/types";
import { useContentModels } from "./useContentModels";
import { useReferences } from "./useReferences";
import { AddItemParams, RemoveItemParams, SimpleItems } from "./SimpleItems";
import { parseIdentifier } from "@webiny/utils";

interface Props {
    bind: BindComponentRenderProp<CmsReferenceValue[] | undefined | null>;
    field: CmsModelField;
}

export const SimpleMultipleRenderer: React.VFC<Props> = props => {
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
        (params: RemoveItemParams) => {
            bind.onChange(
                values.filter(value => {
                    const { id: valueId } = parseIdentifier(value.id);
                    return valueId !== params.entryId;
                })
            );
        },
        [bind, values]
    );

    return (
        <SimpleItems
            values={values}
            items={references.entries}
            addItem={addItem}
            removeItem={removeItem}
        />
    );
};
