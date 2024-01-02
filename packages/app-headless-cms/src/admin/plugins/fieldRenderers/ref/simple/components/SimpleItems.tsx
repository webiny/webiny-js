import React, { useCallback } from "react";
import { Checkbox } from "@webiny/ui/Checkbox";
import {
    CmsReferenceContentEntry,
    CmsReferenceValue
} from "~/admin/plugins/fieldRenderers/ref/components/types";
import { parseIdentifier } from "@webiny/utils";
import styled from "@emotion/styled";
import { CmsModelField } from "~/types";
import { Radio } from "@webiny/ui/Radio";

const Title = styled("h5")({
    display: "block"
});
const ListItem = styled("div")({
    display: "block"
});

export interface AddItemParams {
    id: string;
    modelId: string;
}

export interface RemoveItemParams {
    entryId: string;
    modelId: string;
}

interface ItemProps {
    multiple?: boolean;
    value?: string | null;
    item: CmsReferenceContentEntry;
    onChange: (checked?: boolean) => void;
}

const Item = (props: ItemProps) => {
    const { multiple, value, item, onChange } = props;
    if (!multiple) {
        return <Radio value={value} onChange={onChange} label={item.title} />;
    }
    return <Checkbox value={value} onChange={onChange} label={item.title} />;
};

interface SimpleItemsProps {
    multiple?: boolean;
    field: CmsModelField;
    items?: CmsReferenceContentEntry[];
    values?: CmsReferenceValue[];
    addItem: (params: AddItemParams) => void;
    removeItem: (params: RemoveItemParams) => void;
}

export const SimpleItems = (props: SimpleItemsProps) => {
    const { field, items, values, addItem, removeItem, multiple } = props;

    const onChange = useCallback(
        (item: CmsReferenceContentEntry) => {
            return (checked?: boolean) => {
                if (checked) {
                    addItem({
                        id: item.id,
                        modelId: item.model.modelId
                    });
                    return;
                }
                removeItem({
                    entryId: item.entryId,
                    modelId: item.model.modelId
                });
            };
        },
        [addItem, removeItem, multiple, values]
    );

    if (!items || items.length === 0) {
        return null;
    }
    return (
        <>
            <Title>{field.label}</Title>
            {items.map(item => {
                const checked = (values || []).some(value => {
                    const { id: entryId } = parseIdentifier(value.id);
                    return entryId === item.entryId;
                });
                return (
                    <ListItem key={`item-${item.entryId}`}>
                        <Item
                            multiple={multiple}
                            value={checked ? item.entryId : null}
                            item={item}
                            onChange={onChange(item)}
                        />
                    </ListItem>
                );
            })}
        </>
    );
};
