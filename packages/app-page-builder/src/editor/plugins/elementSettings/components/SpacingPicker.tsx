import React, { useMemo, useCallback } from "react";
import { css } from "emotion";
import classNames from "classnames";
import { FormElementMessage } from "@webiny/ui/FormElementMessage";
import { BindComponentRenderPropValidation, Form, FormOnSubmit } from "@webiny/form";
import InputField from "./InputField";
import SelectField from "./SelectField";

const defaultWrapperStyle = css({
    width: 60,
    "& .inner-wrapper": {
        display: "flex"
    }
});

const defaultInputStyle = css({
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
});

const defaultSelectStyle = css({
    appearance: "none",
    background: "transparent",
    border: "none",
    padding: "0px 0px 0px 4px",
    margin: 0,
    fontSize: 12,
    width: 28,
    backgroundImage: "none",
    "&:focus": {
        outlineWidth: 2,
        outlineStyle: "solid",
        outlineColor: "lightblue"
    }
});

interface SpacingPickerProps {
    value: string;
    onChange: (value: string | number) => void;
    options: any[];
    disabled?: boolean;
    useDefaultStyle?: boolean;
    validation?: BindComponentRenderPropValidation;
    className?: string;
    inputClassName?: string;
    selectClassName?: string;
}

interface SpacingPickerFormData {
    unit: string;
    value: string | number;
}

const SpacingPicker = ({
    value = "",
    onChange,
    disabled,
    options = [],
    validation,
    className,
    inputClassName,
    selectClassName,
    useDefaultStyle = true
}: SpacingPickerProps) => {
    const formData = useMemo(() => {
        const parsedValue = parseFloat(value);
        const regx = new RegExp(`[0-9.+-]+`, "g");
        const unit = value.replace(regx, "");

        if (Number.isNaN(parsedValue) && unit === "auto") {
            return {
                value: "",
                unit
            };
        }
        return {
            value: parsedValue,
            unit
        };
    }, [value]);

    const defaultUnitValue = options[0] ? options[0].value : "";

    const onFormChange: FormOnSubmit<SpacingPickerFormData> = useCallback(
        formData => {
            if (formData.unit === "auto") {
                onChange(formData.unit);
                return;
            }
            onChange(formData.value + (formData.unit || defaultUnitValue));
        },
        [defaultUnitValue, onChange]
    );

    return (
        <Form<SpacingPickerFormData> data={formData} onChange={onFormChange}>
            {({ data, Bind }) => {
                const unitValue = data.unit || defaultUnitValue;
                return (
                    <div
                        className={classNames(className, {
                            [defaultWrapperStyle]: useDefaultStyle
                        })}
                    >
                        <div className={"inner-wrapper"}>
                            <Bind name={"value"}>
                                <InputField
                                    className={classNames(inputClassName, {
                                        [defaultInputStyle]: useDefaultStyle
                                    })}
                                    disabled={data.unit === "auto" || disabled}
                                    type={"number"}
                                    onFocus={(event: React.FocusEvent<HTMLInputElement>) =>
                                        event.target.select()
                                    }
                                    onBlur={(event: React.FocusEvent<HTMLInputElement>) => {
                                        if (event.target.value === "") {
                                            onChange("0" + (formData.unit || defaultUnitValue));
                                        }
                                    }}
                                />
                            </Bind>
                            <Bind name={"unit"}>
                                <SelectField
                                    className={classNames(selectClassName, {
                                        [defaultSelectStyle]: useDefaultStyle
                                    })}
                                    disabled={disabled}
                                    value={unitValue}
                                >
                                    {options.map(item => (
                                        <option key={item.value} value={item.value}>
                                            {item.label}
                                        </option>
                                    ))}
                                </SelectField>
                            </Bind>
                        </div>
                        {validation && validation.isValid === false && (
                            <FormElementMessage error>{validation.message}</FormElementMessage>
                        )}
                    </div>
                );
            }}
        </Form>
    );
};

export default React.memo(SpacingPicker);
