import React, { useEffect, useMemo } from "react";
import { ReactComponent as TagIcon } from "@material-design-icons/svg/round/tag.svg";
import { ReactComponent as DeleteIcon } from "@material-design-icons/svg/round/delete.svg";
import { Cell, Grid } from "@webiny/ui/Grid";
import { Form as DefaultForm, FormOnSubmit, useBind } from "@webiny/form";
import { validation } from "@webiny/validation";
import { Select } from "@webiny/ui/Select";
import { Input } from "@webiny/ui/Input";
import { observer } from "mobx-react-lite";

import { FilterManager } from "./FilterManager";

import { Field } from "./types";
import { IconButton, ButtonPrimary } from "@webiny/ui/Button";
import { generateId } from "@webiny/utils";

interface FormProps {
    fields: Field[];
}

interface FormRowProps {
    id: string;
    fields: Field[];
    onChange: (id: string, data: any) => void;
    onRemove: () => void;
}

const FormRow: React.VFC<FormRowProps> = ({ id, fields, onRemove, onChange }) => {
    const fieldOptions = useMemo(
        () =>
            fields.map(field => ({
                label: field.label,
                value: field.id
            })),
        [fields]
    );

    const conditionOptions = useMemo(
        () => [
            {
                label: "is equal to",
                value: " "
            },
            {
                label: "contains",
                value: "_contains"
            },
            {
                label: "starts with",
                value: "_startsWith"
            },
            {
                label: "is not equal to",
                value: "_not"
            },
            {
                label: "doesn't contain",
                value: "_not_contains"
            },
            {
                label: "doesn't start with",
                value: "_not_startsWith"
            }
        ],
        []
    );

    return (
        <DefaultForm onChange={(data, form) => onChange(id, data)}>
            {({ form, Bind, submit }) => (
                <Grid>
                    <Cell span={4}>
                        <Bind name={"field"} validators={[validation.create("required")]}>
                            <Select label={"Field"} icon={<TagIcon />} options={fieldOptions} />
                        </Bind>
                    </Cell>

                    <Cell span={3}>
                        {form.data.field && (
                            <Bind name={"condition"} validators={[validation.create("required")]}>
                                <Select label={"Condition"} options={conditionOptions} />
                            </Bind>
                        )}
                    </Cell>

                    <Cell span={4}>
                        {form.data.condition && (
                            <Bind name={"value"} validators={[validation.create("required")]}>
                                <Input label={"Value"} />
                            </Bind>
                        )}
                    </Cell>

                    <Cell span={1}>
                        <IconButton icon={<DeleteIcon />} onClick={onRemove} />
                    </Cell>
                </Grid>
            )}
        </DefaultForm>
    );
};

const Form: React.VFC<FormProps> = ({ fields }) => {
    const filterManager = new FilterManager([{ id: `filter-${generateId()}` }]);

    useEffect(() => {
        return () => {
            filterManager.removeAllFilters();
        };
    }, []);

    useEffect(() => {
        console.log("filterManager.filters", filterManager.getFilters());
    }, [filterManager.getFilters().length]);

    const onChange = (id: string, data: any) => {
        filterManager.updateFilter({
            id,
            ...data
        });
    };

    return (
        <>
            {filterManager.getFilters().map(filter => (
                <FormRow
                    key={filter.id}
                    id={filter.id}
                    fields={fields}
                    onRemove={() => filterManager.removeFilter(filter.id)}
                    onChange={onChange}
                />
            ))}
            <ButtonPrimary
                onClick={() => {
                    filterManager.addFilter({ id: `filter-${generateId()}` });
                }}
            >
                Add a field
            </ButtonPrimary>
        </>
    );
};

export default observer(Form);
