import React, { useState } from "react";
import { Input, Select } from "@webiny/admin-ui";

export type UnitOption = {
    label: string;
    value: string;
};

interface UnitValueProps {
    value: string;
    unit: string;
    units: UnitOption[];
    onChange: (value: string) => void;
    onChangePreview: (value: string) => void;
}

class Value {
    static from(value: string | undefined) {
        return value === "auto" ? 0 : parseInt(value ?? "0");
    }
}

const capTo100 = ["%", "vh", "vw"];

export const UnitValuePicker = (props: UnitValueProps) => {
    const [editing, setEditing] = useState(false);

    const defaultValue = editing ? "" : 0;

    const isAuto = props.value === "auto";

    const currentValue = Value.from(props.value);

    const onEnter = () => {
        setValue(props.value);
    };

    const setUnit = (unit: string) => {
        const value = capTo100.includes(unit) && currentValue > 100 ? 100 : currentValue;
        props.onChange(unit === "auto" ? "auto" : `${value}${unit}`);
    };

    const setValue = (value: string) => {
        const parsedValue = Value.from(value);
        const finalValue = isNaN(parsedValue) ? 0 : parsedValue;
        props.onChange(`${finalValue}${props.unit}`);
    };

    const setPreviewValue = (value: string) => {
        setEditing(true);
        let finalValue: string | number = "";
        if (value !== "") {
            const parsedValue = parseInt(value);
            finalValue = isNaN(parsedValue) ? 0 : parsedValue;
        }
        props.onChangePreview(`${finalValue}${props.unit}`);
    };

    return (
        <div className={"flex flex-row space-x-sm"}>
            <div className={"flex-col"}>
                <Input
                    disabled={isAuto}
                    size={"md"}
                    value={isAuto ? "-" : (props.value ?? defaultValue)}
                    onEnter={onEnter}
                    autoSelect={true}
                    onChange={value => setPreviewValue(value)}
                    onBlur={e => setValue(e.target.value)}
                    autoFocus={true}
                />
            </div>
            <div className={"flex-col"}>
                <Select
                    size="md"
                    value={props.unit}
                    options={props.units}
                    onChange={setUnit}
                    displayResetAction={false}
                />
            </div>
        </div>
    );
};
