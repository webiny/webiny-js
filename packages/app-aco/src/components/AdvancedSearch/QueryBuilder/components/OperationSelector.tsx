import React from "react";
import { Bind } from "@webiny/form";
import { Cell, Grid } from "@webiny/ui/Grid";
import { Radio, RadioGroup } from "@webiny/ui/Radio";
import { CellInner } from "./Querybuilder.styled";

const operations = ["AND", "OR"];

interface OperationSelectorProps {
    name: string;
}

export const OperationSelector = ({ name }: OperationSelectorProps) => {
    return (
        <Grid>
            <Cell span={12} align={"middle"}>
                <CellInner align={"center"}>
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
                </CellInner>
            </Cell>
        </Grid>
    );
};
