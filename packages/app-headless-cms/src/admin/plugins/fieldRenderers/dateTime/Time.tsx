import React from "react";
import Input from "./Input";

const Time = props => {
    // "09:00:00"
    return (
        <Input
            {...props}
            bind={{
                ...props.bind,
                onChange: value => {
                    return props.bind.onChange(`${value}:00`);
                }
            }}
            field={{
                ...props.field,
                label: props.label
            }}
            type={"time"}
            trailingIcon={props.trailingIcon}
        />
    );
};

export default Time;
