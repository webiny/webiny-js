import React from "react";

import { Chips, Chip } from "@webiny/ui/Chips";
import { FilterDTO } from "~/components/AdvancedSearch/domain";
import { CloseIcon, EditIcon } from "./SelectedFilter.styled";

interface SelectedFilterProps {
    filter: FilterDTO;
    onEdit: () => void;
    onDelete: () => void;
}

export const SelectedFilter = (props: SelectedFilterProps) => {
    return (
        <Chips>
            <Chip
                label={props.filter.name}
                icon={<EditIcon />}
                onRemove={props.onDelete}
                trailingIconRemovesChip={true}
                onInteraction={props.onEdit}
                trailingIcon={<CloseIcon />}
            />
        </Chips>
    );
};
