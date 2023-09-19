import React from "react";

import { Bind } from "@webiny/form";
import { Radio, RadioGroup } from "@webiny/ui/Radio";

interface BooleanProps {
    name: string;
}

export const Boolean = ({ name }: BooleanProps) => {
    return (
        <Bind name={name}>
            {({ value, onChange }) => (
                <RadioGroup>
                    {() => {
                        return (
                            <>
                                <Radio
                                    label="True"
                                    value={value}
                                    onChange={() => {
                                        onChange(true);
                                    }}
                                />
                                <Radio
                                    label="False"
                                    value={!value}
                                    onChange={() => {
                                        onChange(false);
                                    }}
                                />
                            </>
                        );
                    }}
                </RadioGroup>
            )}
        </Bind>
    );
};
