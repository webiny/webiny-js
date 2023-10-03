import React from "react";
import { Bind } from "@webiny/form";
import { Radio, RadioGroup } from "@webiny/ui/Radio";

const operations = ["AND", "OR"];

interface OperationSelectorProps {
    name: string;
}

export const OperationSelector = ({ name }: OperationSelectorProps) => {
    return (
        <Bind name={name}>
            <RadioGroup label={"Operation"}>
                {({ onChange, getValue }) => (
                    <>
                        {operations.map(option => (
                            <Radio
                                key={option}
                                label={option}
                                value={getValue(option)}
                                onChange={onChange(option)}
                            />
                        ))}
                    </>
                )}
            </RadioGroup>
        </Bind>
    );
};
