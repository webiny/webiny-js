import React from "react";

import { Chips, Chip } from "@webiny/ui/Chips";

import { QueryObjectDTO } from "~/components/AdvancedSearch/QueryObject";

import { CloseIcon, EditIcon } from "./SelectedFilter.styled";

interface SelectedFilterProps {
    filter: QueryObjectDTO;
    onEdit: () => void;
    onDelete: () => void;
}

export const SelectedFilter = (props: SelectedFilterProps) => {
    return (
        <Chips>
            <Chip
                key={props.filter.id}
                label={props.filter.name}
                icon={<EditIcon />}
                onTrailingIconInteraction={props.onDelete}
                onInteraction={props.onEdit}
                trailingIcon={<CloseIcon />}
            />
        </Chips>
    );
};
