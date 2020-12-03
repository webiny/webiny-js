import React from "react";
import styled from "@emotion/styled";
import InputField from "./InputField";
import SelectField from "./SelectField";

const SpacingPickerWrapper = styled("div")({
    display: "flex",
    width: 60,

    "& .input-field": {
        appearance: "none",
        background: "transparent",
        border: "none",
        margin: 0,
        fontSize: 11,
        padding: 0,
        width: 24,
        textAlign: "right",

        transition: "all 200ms ease-in",

        "&:focus": {
            padding: "0px 4px",
            width: 36,
            textAlign: "center",
            outlineColor: "lightblue"
        }
    },
    "& .select-field": {
        appearance: "none",
        background: "transparent",
        border: "none",
        padding: "0px 4px",
        margin: 0,
        fontSize: 12,
        width: 24,
        backgroundImage: "none",
        "&:focus": {
            outlineWidth: 2,
            outlineStyle: "solid",
            outlineColor: "lightblue"
        }
    }
});

type SpacingPickerProps = {
    value: any;
    onChange: (value: string | number) => void;
    unitValue: string;
    unitOnChange: (value: string) => void;
    disabled?: boolean;
    options: any[];
};
const SpacingPicker = ({
    value,
    onChange,
    unitValue,
    unitOnChange,
    disabled,
    options = []
}: SpacingPickerProps) => {
    return (
        <SpacingPickerWrapper>
            <InputField
                className={"input-field"}
                value={value}
                onChange={onChange}
                disabled={disabled}
                type={"number"}
            />
            <SelectField
                className={"select-field"}
                value={unitValue || "px"}
                onChange={unitOnChange}
                disabled={disabled}
            >
                {options.map(item => (
                    <option key={item.value} value={item.value}>
                        {item.label}
                    </option>
                ))}
            </SelectField>
        </SpacingPickerWrapper>
    );
};

export default React.memo(SpacingPicker);
