import React, { useState } from "react";
import { InputField, StyledInput } from "./Input";
import { StyledSelect } from "./Select";
import { Field as FieldWrapper } from "./components/Field";
import { useBind, BindComponentRenderProp } from "@webiny/form";
import { FormRenderFbFormModelField } from "@webiny/app-form-builder/types";
import { FieldLabel } from "./components/FieldLabel";
import { FieldErrorMessage } from "./components/FieldErrorMessage";
import styled from "@emotion/styled";

const UTC_TIMEZONES = [
    {
        value: "-12:00",
        label: "UTC-12:00"
    },
    {
        value: "-11:00",
        label: "UTC-11:00"
    },
    {
        value: "-10:00",
        label: "UTC-10:00"
    },
    {
        value: "-09:30",
        label: "UTC-09:30"
    },
    {
        value: "-09:00",
        label: "UTC-09:00"
    },
    {
        value: "-08:00",
        label: "UTC-08:00"
    },
    {
        value: "-07:00",
        label: "UTC-07:00"
    },
    {
        value: "-06:00",
        label: "UTC-06:00"
    },
    {
        value: "-05:00",
        label: "UTC-05:00"
    },
    {
        value: "-04:30",
        label: "UTC-04:30"
    },
    {
        value: "-04:00",
        label: "UTC-04:00"
    },
    {
        value: "-03:30",
        label: "UTC-03:30"
    },
    {
        value: "-03:00",
        label: "UTC-03:00"
    },
    {
        value: "-02:00",
        label: "UTC-02:00"
    },
    {
        value: "-01:00",
        label: "UTC-01:00"
    },
    {
        value: "+00:00",
        label: "UTC+00:00"
    },
    {
        value: "+01:00",
        label: "UTC+01:00"
    },
    {
        value: "+02:00",
        label: "UTC+02:00"
    },
    {
        value: "+03:00",
        label: "UTC+03:00"
    },
    {
        value: "+03:30",
        label: "UTC+03:30"
    },
    {
        value: "+04:00",
        label: "UTC+04:00"
    },
    {
        value: "+04:30",
        label: "UTC+04:30"
    },
    {
        value: "+05:30",
        label: "UTC+05:30"
    },
    {
        value: "+05:45",
        label: "UTC+05:45"
    },
    {
        value: "+06:00",
        label: "UTC+06:00"
    },
    {
        value: "+06:30",
        label: "UTC+06:30"
    },
    {
        value: "+07:00",
        label: "UTC+07:00"
    },
    {
        value: "+08:00",
        label: "UTC+08:00"
    },
    {
        value: "+08:45",
        label: "UTC+08:45"
    },
    {
        value: "+09:00",
        label: "UTC+09:00"
    },
    {
        value: "+09:30",
        label: "UTC+09:30"
    },
    {
        value: "+10:00",
        label: "UTC+10:00"
    },
    {
        value: "+10:30",
        label: "UTC+10:30"
    },
    {
        value: "+11:00",
        label: "UTC+11:00"
    },
    {
        value: "+11:30",
        label: "UTC+11:30"
    },
    {
        value: "+12:00",
        label: "UTC+12:00"
    },
    {
        value: "+12:45",
        label: "UTC+12:45"
    },
    {
        value: "+13:00",
        label: "UTC+13:00"
    },
    {
        value: "+14:00",
        label: "UTC+14:00"
    }
];

const SelectLabel = styled.div`
    display: inline-block;
    width: 100%;
    margin: 0 0 5px 14px;
`;

const DateFieldWrapper = styled.div`
    display: flex;
    align-items: flex-start;

    & #timeZoneField {
        height: 100%;
        margin-left: 15px;
    }
`;

const SelectTimeZoneField = ({
    onChange,
    dateTime,
    timeZone,
    setTimeZone
}: {
    onChange: BindComponentRenderProp["onChange"];
    dateTime: string;
    timeZone: string;
    setTimeZone: (e: any) => void;
}) => {
    const handleOnChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setTimeZone(e.target.value);
        onChange(`${dateTime}${e.target.value}`);
    };

    return (
        <FieldWrapper>
            <StyledSelect
                value={timeZone}
                onChange={handleOnChange}
                id={"timeZoneField"}
                name={"Time Zone"}
            >
                {(UTC_TIMEZONES || []).map(({ value, label }) => (
                    <option key={value} value={value}>
                        {label}
                    </option>
                ))}
            </StyledSelect>
        </FieldWrapper>
    );
};

const DateFieldWithTimeZone = (props: { field: FormRenderFbFormModelField }) => {
    const [dateTime, setDateTime] = useState("");
    const [timeZone, setTimeZone] = useState("+03:00");

    const { validation, validate, onChange } = useBind({
        name: props.field.fieldId,
        validators: props.field.validators
    });

    const onBlur = (ev: React.SyntheticEvent) => {
        if (validate) {
            // Since we are accessing event in an async operation, we need to persist it.
            // See https://reactjs.org/docs/events.html#event-pooling.
            ev.persist();
            validate();
        }
    };

    const handleDateTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDateTime(e.target.value);
        onChange(`${e.target.value}${timeZone}`);
    };

    return (
        <DateFieldWrapper>
            <FieldWrapper>
                <FieldLabel {...props} />
                <StyledInput
                    type="datetime-local"
                    value={dateTime}
                    onChange={handleDateTimeChange}
                    onBlur={onBlur}
                />
                <FieldErrorMessage isValid={validation.isValid} message={validation.message} />
            </FieldWrapper>
            <FieldWrapper>
                <SelectLabel>Timezone</SelectLabel>
                <SelectTimeZoneField
                    onChange={onChange}
                    timeZone={timeZone}
                    setTimeZone={setTimeZone}
                    dateTime={dateTime}
                />
            </FieldWrapper>
        </DateFieldWrapper>
    );
};

export const DateField = (props: { field: FormRenderFbFormModelField }) => {
    const { settings } = props.field;

    if (settings.format === "time") {
        return <InputField {...props} type="time" />;
    } else if (settings.format === "dateTimeWithoutTimezone") {
        return <InputField {...props} type="datetime-local" />;
    } else if (settings.format === "dateTimeWithTimezone") {
        return <DateFieldWithTimeZone {...props} />;
    } else {
        return <InputField {...props} type="date" />;
    }
};
