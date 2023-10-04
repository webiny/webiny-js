import React from "react";
import { Observer } from "mobx-react-lite";
import { Bind } from "@webiny/form";
import { Cell, Grid } from "@webiny/ui/Grid";
import { Select } from "@webiny/ui/Select";

import { InputField } from "./InputField";
import { RemoveFilter } from "./controls";

import { FieldDTO, FilterDTO } from "../../../QueryObject";

import { CellInner, FilterWrapper } from "../Querybuilder.styled";

interface FilterProps {
    name: string;
    filter: FilterDTO;
    fields: FieldDTO[];
    onDelete: () => void;
    onEmpty: () => void;
}

export const Filter = ({ name, onDelete, onEmpty, fields, filter }: FilterProps) => {
    return (
        <Observer>
            {() => (
                <FilterWrapper>
                    <Grid>
                        <Cell span={4}>
                            <CellInner align={"left"}>
                                <Bind name={`${name}.field`}>
                                    {({ value, onChange, validation }) => (
                                        <Select
                                            label={"Field"}
                                            options={fields.map(field => ({
                                                label: field.label,
                                                value: field.value
                                            }))}
                                            value={value}
                                            onChange={data => {
                                                // We need to empty previously entered data into other fields
                                                onEmpty();
                                                // Setting the right data into `field`
                                                onChange(data);
                                            }}
                                            validation={validation}
                                        />
                                    )}
                                </Bind>
                            </CellInner>
                        </Cell>
                        <Cell span={3}>
                            <CellInner align={"left"}>
                                {filter.field && (
                                    <Bind name={`${name}.condition`}>
                                        {({ value, onChange, validation }) => (
                                            <Select
                                                label={"Condition"}
                                                options={
                                                    fields.find(
                                                        field => field.value === filter.field
                                                    )?.conditions || []
                                                }
                                                value={value}
                                                onChange={onChange}
                                                validation={validation}
                                            />
                                        )}
                                    </Bind>
                                )}
                            </CellInner>
                        </Cell>
                        <Cell span={4} align={"middle"}>
                            <CellInner align={"left"}>
                                {filter.condition && (
                                    <InputField
                                        name={`${name}.value`}
                                        field={fields.find(field => field.value === filter.field)}
                                    />
                                )}
                            </CellInner>
                        </Cell>
                        <Cell span={1} align={"middle"}>
                            <CellInner align={"center"}>
                                <RemoveFilter onClick={onDelete} />
                            </CellInner>
                        </Cell>
                    </Grid>
                </FilterWrapper>
            )}
        </Observer>
    );
};
