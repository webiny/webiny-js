import React from "react";
import Input from "./Input";

const Time = props => {
    // "09:00:00"
    return (
        <Input
            {...props}
            field={{
                ...props.field,
                label: props.label || props.field.label
            }}
            type={"time"}
            step={5}
            trailingIcon={props.trailingIcon}
        />
    );
};

export default Time;
