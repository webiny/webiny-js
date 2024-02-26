import React from "react";

import { Typography } from "@webiny/ui/Typography";

import { FilterOperationLabelContainer } from "../Querybuilder.styled";

interface FilterOperationLabelProps {
    operation: string;
    show: boolean;
}
export const FilterOperationLabel = ({ operation, show }: FilterOperationLabelProps) => {
    if (!show) {
        return null;
    }

    return (
        <FilterOperationLabelContainer>
            <Typography use={"caption"}>{operation}</Typography>
        </FilterOperationLabelContainer>
    );
};
