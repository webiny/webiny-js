import React from "react";

import { Bind } from "@webiny/form";
import { Cell, Grid } from "@webiny/ui/Grid";
import { Select } from "@webiny/ui/Select";

import { InputField } from "./InputField";
import { RemoveFilter } from "./controls";

import { FieldDTO, QueryObjectFilterDTO } from "../../../domain";

import { CellInner, FilterContainer } from "../Querybuilder.styled";

interface FilterProps {
    name: string;
    filter: QueryObjectFilterDTO;
    fields: FieldDTO[];
    onDelete: () => void;
    onFieldSelectChange: (data: string) => void;
}

export const Filter = ({ name, onDelete, onFieldSelectChange, fields, filter }: FilterProps) => {
    return (
        <FilterContainer>
            <Grid>
                <Cell span={4}>
                    <CellInner align={"left"}>
                        <Bind name={`${name}.field`}>
                            {({ value, validation }) => (
                                <Select
                                    label={"Field"}
                                    options={fields.map(field => ({
                                        label: field.label,
                                        value: field.value
                                    }))}
                                    value={value}
                                    onChange={data => onFieldSelectChange(data)}
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
                                            fields.find(field => field.value === filter.field)
                                                ?.conditions || []
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
        </FilterContainer>
    );
};
