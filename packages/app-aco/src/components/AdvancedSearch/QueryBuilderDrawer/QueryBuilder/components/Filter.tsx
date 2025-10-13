import React from "react";
import { Bind } from "@webiny/form";

import { AutoComplete, Grid, Select } from "@webiny/admin-ui";

import { InputField } from "./InputField.js";
import { RemoveFilter } from "./controls/index.js";

import type { FieldDTOWithElement, FilterGroupFilterDTO } from "../../../domain/index.js";

interface FilterProps {
    name: string;
    filter: FilterGroupFilterDTO & { canDelete: boolean };
    fields: FieldDTOWithElement[];
    onDelete: () => void;
    onFieldSelectChange: (data: string) => void;
}

export const Filter = ({ name, onDelete, onFieldSelectChange, fields, filter }: FilterProps) => {
    return (
        <Grid>
            <Grid.Column span={4}>
                <div className={"text-left"}>
                    <Bind name={`${name}.field`}>
                        {({ value, validation }) => {
                            const options = fields.map(field => ({
                                value: field.value,
                                label: field.label
                            }));

                            return (
                                <AutoComplete
                                    label={"Field"}
                                    options={options}
                                    value={value}
                                    onValueChange={selected => {
                                        /**
                                         * Update the selected value only if it's different from the current value.
                                         * When the value is populated from data, onChange might trigger re-rendering of the form and clear related fields.
                                         */
                                        if (selected !== value) {
                                            onFieldSelectChange(selected);
                                        }
                                    }}
                                    validation={validation}
                                    size={"lg"}
                                />
                            );
                        }}
                    </Bind>
                </div>
            </Grid.Column>
            <Grid.Column span={3}>
                <div className={"text-left"}>
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
                                    size={"lg"}
                                />
                            )}
                        </Bind>
                    )}
                </div>
            </Grid.Column>
            <Grid.Column span={4}>
                <div className={"text-left"}>
                    {filter.condition && (
                        <InputField
                            name={`${name}.value`}
                            field={fields.find(field => field.value === filter.field)}
                        />
                    )}
                </div>
            </Grid.Column>
            <Grid.Column span={1}>
                <div className={"flex justify-center items-end h-full"}>
                    <RemoveFilter onClick={onDelete} disabled={!filter.canDelete} />
                </div>
            </Grid.Column>
        </Grid>
    );
};
