import React from "react";

import { Chips, Chip } from "@webiny/ui/Chips";

import { QueryObjectDTO } from "~/components/AdvancedSearch/QueryObject";

import { CloseIcon, EditIcon } from "./SelectedFilter.styled";

interface SelectedFilterProps {
    filter: QueryObjectDTO | null;
    onEdit: (data: QueryObjectDTO) => void;
    onRemove: () => void;
    show: boolean;
}

export const SelectedFilter = (props: SelectedFilterProps) => {
    if (!props.filter || !props.show) {
        return null;
    }

    return (
        <Chips>
            <Chip
                key={props.filter.id}
                label={props.filter.name}
                icon={<EditIcon />}
                onTrailingIconInteraction={props.onRemove}
                onInteraction={() => props.onEdit(props.filter as QueryObjectDTO)}
                trailingIcon={<CloseIcon />}
            />
        </Chips>
    );
};
