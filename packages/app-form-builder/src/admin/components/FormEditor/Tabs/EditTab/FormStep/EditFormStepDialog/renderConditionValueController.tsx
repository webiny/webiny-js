import React from "react";
import { Select } from "@webiny/ui/Select";
import { Input } from "@webiny/ui/Input";
import { FbFormModelField, FbFormCondition } from "~/types";
import { DateTime } from "./DateTime";

interface Props {
    condition: FbFormCondition;
    fields: (FbFormModelField | null)[];
    handleOnChange: (
        conditionProperty: keyof FbFormCondition,
        conditionPropertyValue: string
    ) => void;
}

export const renderConditionValueController: React.FC<Props> = ({
    condition,
    fields,
    handleOnChange
}) => {
    const fieldType = fields.find(field => field?.fieldId === condition.fieldName)?.type || "";

    const fieldOptions = fields.find(field => field?.fieldId === condition.fieldName)?.options;

    /*
        We need this settings in case we have selected DateTime field,
        because timezone is being stored inside of field setting.
    */
    const fieldSettings =
        fields.find(field => field?.fieldId === condition.fieldName)?.settings || "";

    switch (fieldType) {
        case "text":
            return (
                <Input
                    label="Enter text"
                    onChange={value => handleOnChange("filterValue", value)}
                    value={condition.filterValue}
                />
            );
        case "select":
            return (
                <Select
                    label="Select Value"
                    placeholder="Select Value"
                    onChange={value => handleOnChange("filterValue", value)}
                    value={condition.filterValue}
                >
                    {fieldOptions?.map((option, index) => (
                        <option key={index} value={option.value}>
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
                    onChange={value => handleOnChange("filterValue", value)}
                    value={condition.filterValue}
                >
                    {fieldOptions?.map((option, index) => (
                        <option key={index} value={option.value}>
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
                    onChange={value => handleOnChange("filterValue", value)}
                    value={condition?.filterValue}
                >
                    {fieldOptions?.map((option, index) => (
                        <option key={index} value={option.value}>
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
                    onChange={value => handleOnChange("filterValue", value)}
                    value={condition.filterValue}
                />
            );
        case "datetime":
            return (
                <DateTime
                    settings={fieldSettings as Record<string, any>}
                    handleOnChange={handleOnChange}
                    value={condition.filterValue}
                />
            );
        case "hidden":
            return (
                <Input
                    label="Enter text"
                    onChange={value => handleOnChange("filterValue", value)}
                    value={condition.filterValue}
                />
            );
        default:
            return <span>Please, select field</span>;
    }
};
