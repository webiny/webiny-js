import React from "react";
import { Checkbox } from "@webiny/ui/Checkbox";
import {
    CmsReferenceContentEntry,
    CmsReferenceValue
} from "~/admin/plugins/fieldRenderers/ref/components/types";
import { parseIdentifier } from "@webiny/utils";
import styled from "@emotion/styled";

const Item = styled("div")({
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

interface Props {
    items?: CmsReferenceContentEntry[];
    values?: CmsReferenceValue[];
    addItem: (params: AddItemParams) => void;
    removeItem: (params: RemoveItemParams) => void;
}

export const SimpleItems: React.VFC<Props> = props => {
    const { items, values, addItem, removeItem } = props;

    if (!items || items.length === 0) {
        return null;
    }
    return (
        <div>
            {items.map(item => {
                const checked = (values || []).some(value => {
                    const { id: entryId } = parseIdentifier(value.id);
                    return entryId === item.entryId;
                });
                return (
                    <Item>
                        <Checkbox
                            value={checked ? item.entryId : null}
                            onChange={checked => {
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
                            }}
                            label={item.title}
                        />
                    </Item>
                );
            })}
        </div>
    );
};
