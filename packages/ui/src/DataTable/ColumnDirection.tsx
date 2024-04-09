import React from "react";
import { ColumnDirectionIcon, ColumnDirectionWrapper } from "~/DataTable/styled";

export interface ColumnDirectionProps {
    direction?: "asc" | "desc";
}

export const ColumnDirection = (props: ColumnDirectionProps) => {
    if (props.direction) {
        return (
            <ColumnDirectionWrapper>
                <ColumnDirectionIcon direction={props.direction} />
            </ColumnDirectionWrapper>
        );
    }

    return null;
};
