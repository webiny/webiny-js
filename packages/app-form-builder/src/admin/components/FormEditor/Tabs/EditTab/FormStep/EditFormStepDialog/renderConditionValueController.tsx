import React from "react";
import { Select } from "@webiny/ui/Select";
import { Input } from "@webiny/ui/Input";
import { FbFormStepCondition } from "~/types";
import { DateTime } from "./DateTime";

interface Props {
    condition: FbFormStepCondition;
    fieldType: string;
    fieldOptions:
        | {
              value: string;
              label: string;
          }[]
        | undefined;
    handleCondition: (property: string, val: string) => void;
    fieldSettings: string | Record<any, any>;
}

export const renderConditionValueController: React.FC<Props> = ({
    condition,
    fieldType,
    fieldOptions,
    fieldSettings,
    handleCondition
}) => {
    switch (fieldType) {
        case "text":
            return (
                <Input
                    label="Enter text"
                    onChange={val => handleCondition("filterValue", val)}
                    value={condition?.filterValue || ""}
                />
            );
        case "select":
            return (
                <Select
                    label="Select Value"
                    placeholder="Select Value"
                    onChange={val => handleCondition("filterValue", val)}
                    value={condition?.filterValue || ""}
                >
                    {fieldOptions?.map(option => (
                        <option key={`++${option.label}--`} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </Select>
            );
        case "radio":
            return (
                <Select
                    label="Select Value"
                    placeholder="Select Value"
                    onChange={val => handleCondition("filterValue", val)}
                    value={condition?.filterValue || ""}
                >
                    {fieldOptions?.map(option => (
                        <option key={`++${option.label}--`} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </Select>
            );
        case "checkbox":
            return (
                <Select
                    label="Select Value"
                    placeholder="Select Value"
                    onChange={val => handleCondition("filterValue", val)}
                    value={condition?.filterValue || ""}
                >
                    {fieldOptions?.map(option => (
                        <option key={`++${option.label}--`} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </Select>
            );
        case "number":
            return (
                <Input
                    type="number"
                    placeholder="Enter Number"
                    onChange={val => handleCondition("filterValue", val)}
                    value={condition?.filterValue || ""}
                />
            );
        case "datetime":
            return (
                <DateTime
                    settings={fieldSettings as Record<string, any>}
                    handleCondition={handleCondition}
                    value={condition?.filterValue || ""}
                />
            );
        case "hidden":
            return (
                <Input
                    label="Enter text"
                    onChange={val => handleCondition("filterValue", val)}
                    value={condition?.filterValue || ""}
                />
            );
        default:
            return <span>Please, select field</span>;
    }
};
