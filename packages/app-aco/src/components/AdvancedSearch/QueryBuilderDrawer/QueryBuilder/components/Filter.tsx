import React from "react";

import { Bind } from "@webiny/form";
import { AutoComplete } from "@webiny/ui/AutoComplete";
import { Cell, Grid } from "@webiny/ui/Grid";
import { Select } from "@webiny/ui/Select";

import { InputField } from "./InputField";
import { RemoveFilter } from "./controls";

import { FieldDTO, FilterGroupFilterDTO } from "../../../domain";

import { CellInner, FilterContainer } from "../Querybuilder.styled";

interface FilterProps {
    name: string;
    filter: FilterGroupFilterDTO & { canDelete: boolean };
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
                            {({ value, validation }) => {
                                const options = fields.map(field => ({
                                    id: field.value,
                                    name: field.label
                                }));

                                return (
                                    <AutoComplete
                                        label={"Field"}
                                        options={options}
                                        value={options.find(option => option.id === value)}
                                        onChange={data => onFieldSelectChange(data)}
                                        validation={validation}
                                    />
                                );
                            }}
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
                        <RemoveFilter onClick={onDelete} disabled={!filter.canDelete} />
                    </CellInner>
                </Cell>
            </Grid>
        </FilterContainer>
    );
};
