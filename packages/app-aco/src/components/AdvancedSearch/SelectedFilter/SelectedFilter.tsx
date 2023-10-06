import React from "react";

import { Chips, Chip } from "@webiny/ui/Chips";
import { CloseIcon, EditIcon } from "~/components/AdvancedSearch/Chip/Chip.styled";
import { QueryObjectDTO } from "~/components/AdvancedSearch/QueryObject";

interface ChipProps {
    queryObject: QueryObjectDTO | null;
    onEdit: () => void;
    onDelete: () => void;
    show: boolean;
}

export const SelectedFilter = (props: ChipProps) => {
    if (!props.queryObject || !props.show) {
        return null;
    }

    return (
        <Chips>
            <Chip
                key={props.queryObject.id}
                label={props.queryObject.name}
                icon={<EditIcon />}
                onTrailingIconInteraction={props.onDelete}
                onInteraction={props.onEdit}
                trailingIcon={<CloseIcon />}
            />
        </Chips>
    );
};
