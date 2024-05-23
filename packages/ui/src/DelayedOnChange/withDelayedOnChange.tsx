import React from "react";
import { DelayedOnChange, DelayedOnChangeProps } from "./DelayedOnChange";

export default function withDelayedOnChange() {
    return function decorator(Component: React.ComponentType<DelayedOnChangeProps>) {
        return function WithDelayedOnChange(props: DelayedOnChangeProps) {
            const { value, onChange, ...rest } = props;
            return (
                <DelayedOnChange value={value} onChange={onChange}>
                    {({ value, onChange }) => (
                        <Component {...rest} value={value} onChange={onChange} />
                    )}
                </DelayedOnChange>
            );
        };
    };
}
