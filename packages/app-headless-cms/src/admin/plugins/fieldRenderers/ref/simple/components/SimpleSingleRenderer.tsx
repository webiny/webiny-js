import React, { useCallback, useMemo } from "react";
import { BindComponentRenderProp, CmsModelField } from "@webiny/app-headless-cms-common/types";
import { CmsReferenceValue } from "~/admin/plugins/fieldRenderers/ref/components/types";
import { useContentModels } from "./useContentModels";
import { useReferences } from "./useReferences";
import { AddItemParams, SimpleItems } from "./SimpleItems";

interface Props {
    bind: BindComponentRenderProp<CmsReferenceValue | undefined | null>;
    field: CmsModelField;
}

export const SimpleSingleRenderer: React.VFC<Props> = props => {
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
