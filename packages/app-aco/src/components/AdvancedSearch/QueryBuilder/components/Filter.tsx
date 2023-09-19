import React from "react";
import { Bind } from "@webiny/form";
import { Cell, Grid } from "@webiny/ui/Grid";
import { FieldDTO, FilterDTO } from "../domain";
import { CellInner, FilterWrapper } from "./Querybuilder.styled";
import { Select } from "@webiny/ui/Select";
import { InputField } from "./InputField";
import { RemoveFilter } from "./controls";
import { Observer } from "mobx-react-lite";

interface FilterProps {
    name: string;
    filter: FilterDTO;
    fields: FieldDTO[];
    onDelete: () => void;
    onEmpty: () => void;
}

const ValidationMessage = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className={"invalid-feedback"} style={{ display: "block" }}>
            {children}
        </div>
    );
};

export const Filter = ({ name, onDelete, onEmpty, fields, filter }: FilterProps) => {
    return (
        <Observer>
            {() => (
                <FilterWrapper>
                    <Grid>
                        <Cell span={4}>
                            <Bind name={`${name}.field`}>
                                {({ value, onChange, validation }) => (
                                    <>
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
                                        {!validation.isValid ? (
                                            <ValidationMessage>
                                                {validation.message}
                                            </ValidationMessage>
                                        ) : null}
                                    </>
                                )}
                            </Bind>
                        </Cell>
                        <Cell span={3}>
                            {filter.field && (
                                <Bind name={`${name}.condition`}>
                                    {({ value, onChange, validation }) => (
                                        <>
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
                                            {!validation.isValid ? (
                                                <ValidationMessage>
                                                    {validation.message}
                                                </ValidationMessage>
                                            ) : null}
                                        </>
                                    )}
                                </Bind>
                            )}
                        </Cell>
                        <Cell span={4} align={"middle"}>
                            {filter.condition && (
                                <Bind name={`${name}.value`}>
                                    {({ validation, value }) => {
                                        return (
                                            <>
                                                <InputField
                                                    name={`${name}.value`}
                                                    value={value}
                                                    field={fields.find(
                                                        field => field.value === filter.field
                                                    )}
                                                />
                                                {!validation.isValid ? (
                                                    <ValidationMessage>
                                                        {validation.message}
                                                    </ValidationMessage>
                                                ) : null}
                                            </>
                                        );
                                    }}
                                </Bind>
                            )}
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
