import React from "react";
import { Text } from "@webiny/admin-ui";

interface FilterOperationLabelProps {
    operation: string;
    show: boolean;
}
export const FilterOperationLabel = ({ operation, show }: FilterOperationLabelProps) => {
    if (!show) {
        return null;
    }

    return (
        <div className={"pt-sm-plus text-center"}>
            <Text size={"sm"}>{operation}</Text>
        </div>
    );
};
