import React, { useCallback } from "react";
import { ReactComponent as DeleteIcon } from "@material-design-icons/svg/round/delete.svg";
import { Bind } from "@webiny/form";
import { Cell, Grid } from "@webiny/ui/Grid";
import { Select } from "@webiny/ui/Select";
import { validation } from "@webiny/validation";
import { IconButton } from "@webiny/ui/Button";

import { Field, TFilter } from "~/components/AdvancedSearch/types";
import { InputField } from "~/components/AdvancedSearch/InputField";
import { Radio, RadioGroup } from "@webiny/ui/Radio";
import { PossibleHiddenField } from "~/components/AdvancedSearch/styled";

interface FilterProps {
    filter: TFilter;
    fields: Field[];
    index: number;
    onRemove: (id: string) => void;
}

export const Filter: React.VFC<FilterProps> = ({ filter, fields, onRemove, index }) => {
    const getFieldOptions = useCallback(
        () =>
            fields.map(field => ({
                label: field.label,
                value: field.id
            })),
        [fields]
    );

    const getConditionOptions = useCallback((field?: Field) => {
        if (!field) {
            return [];
        }

        switch (field.type) {
            case "text": {
                // Predefined values
                if (field.predefinedValues?.enabled) {
                    return [
                        {
                            label: "contains",
                            value: "_in"
                        },
                        {
                            label: "doesn't contain",
                            value: "_not_in"
                        }
                    ];
                }

                return [
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
                ];
            }

            case "long-text": {
                return [
                    {
                        label: "contains",
                        value: "_contains"
                    },
                    {
                        label: "doesn't contain",
                        value: "_not_contains"
                    }
                ];
            }

            case "boolean": {
                return [
                    {
                        label: "is",
                        value: " "
                    },
                    {
                        label: "is not",
                        value: "_not"
                    }
                ];
            }

            case "number": {
                return [
                    {
                        label: "is equal to",
                        value: " "
                    },
                    {
                        label: "is not equal to",
                        value: "_not"
                    },
                    {
                        label: "is less than",
                        value: "_lt"
                    },
                    {
                        label: "is less or equal to",
                        value: "_lte"
                    },
                    {
                        label: "is greater than",
                        value: "_gt"
                    },
                    {
                        label: "is greater or equal to",
                        value: "_gte"
                    }
                ];
            }

            case "datetime": {
                return [
                    {
                        label: "is equal to",
                        value: " "
                    },
                    {
                        label: "is not equal to",
                        value: "_not"
                    },
                    {
                        label: "is before",
                        value: "_lt"
                    },
                    {
                        label: "is before or equal to",
                        value: "_lte"
                    },
                    {
                        label: "is after",
                        value: "_gt"
                    },
                    {
                        label: "is after or equal to",
                        value: "_gte"
                    }
                ];
            }

            case "ref": {
                return [
                    {
                        label: "is equal to",
                        value: " "
                    },
                    {
                        label: "is not equal to",
                        value: "_not"
                    }
                ];
            }

            default: {
                return [];
            }
        }
    }, []);

    return (
        <>
            <Bind name={`filters.${index}.id`} defaultValue={filter.id}></Bind>
            <PossibleHiddenField hidden={index === 0}>
                <Grid>
                    <Cell span={12} align={"middle"}>
                        <Bind name={`filters.${index}.operation`} defaultValue={"AND"}>
                            <RadioGroup label="Operation">
                                {({ onChange, getValue }) => (
                                    <>
                                        {["AND", "OR"].map(option => (
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
                    </Cell>
                </Grid>
            </PossibleHiddenField>
            <Grid>
                <Cell span={4}>
                    <Bind
                        name={`filters.${index}.field`}
                        validators={[validation.create("required")]}
                    >
                        <Select label={"Field"} options={getFieldOptions()} />
                    </Bind>
                </Cell>
                <Cell span={3}>
                    {filter.field && (
                        <Bind
                            name={`filters.${index}.condition`}
                            validators={[validation.create("required")]}
                        >
                            <Select
                                label={"Condition"}
                                options={getConditionOptions(
                                    fields.find(field => field.id === filter.field)
                                )}
                            />
                        </Bind>
                    )}
                </Cell>
                <Cell span={4} align={"middle"}>
                    {filter.condition && (
                        <InputField
                            name={`filters.${index}.value`}
                            field={fields.find(field => field.id === filter.field)}
                        />
                    )}
                </Cell>
                <Cell span={1} align={"middle"}>
                    <IconButton icon={<DeleteIcon />} onClick={() => onRemove(filter.id)} />
                </Cell>
            </Grid>
        </>
    );
};
