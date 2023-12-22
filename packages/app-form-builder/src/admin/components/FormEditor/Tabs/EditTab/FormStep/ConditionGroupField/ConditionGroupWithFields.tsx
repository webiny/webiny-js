import React from "react";
import { FbFormModelField } from "~/types";
import { ConditionalGroupRow } from "./ConditionGroupRow";

export interface ConditionGroupWithFieldsProps {
    fields: FbFormModelField[][];
    conditionGroup: FbFormModelField;
}

export const ConditionGroupWithFields = ({
    fields,
    conditionGroup
}: ConditionGroupWithFieldsProps) => {
    return (
        <React.Fragment>
            {fields.map((row, rowIndex) => (
                <ConditionalGroupRow
                    key={`conditional-group-row-${rowIndex}`}
                    row={row}
                    rowIndex={rowIndex}
                    conditionGroup={conditionGroup}
                    isLastRow={rowIndex === fields.length - 1}
                />
            ))}
        </React.Fragment>
    );
};
