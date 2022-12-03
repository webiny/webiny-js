import React from "react";
import Delayed, { DelayedOnChangeProps } from "./DelayedOnChange";

export default function withDelayedOnChange() {
    return function decorator(Component: React.FC<DelayedOnChangeProps>) {
        return function WithDelayedOnChange(props: DelayedOnChangeProps) {
            const { value, onChange, ...rest } = props;
            return (
                <Delayed value={value} onChange={onChange}>
                    {({ value, onChange }) => (
                        <Component {...rest} value={value} onChange={onChange} />
                    )}
                </Delayed>
            );
        };
    };
}
