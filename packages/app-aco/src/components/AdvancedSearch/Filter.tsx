import React, { useCallback } from "react";
import { ReactComponent as DeleteIcon } from "@material-design-icons/svg/round/delete.svg";
import { Bind } from "@webiny/form";
import { Cell, Grid } from "@webiny/ui/Grid";
import { Select } from "@webiny/ui/Select";
import { validation } from "@webiny/validation";
import { IconButton } from "@webiny/ui/Button";

import { InputField } from "./InputField";

import { CellInner, FilterWrapper } from "./styled";

import { Field, IFilter } from "./types";
import { observer } from "mobx-react-lite";

interface FilterProps {
    filter: IFilter;
    fields: Field[];
    groupIndex: number;
    filterIndex: number;
    onRemove: (id: string) => void;
}

export const Filter: React.VFC<FilterProps> = observer(
    ({ filter, fields, onRemove, groupIndex, filterIndex }) => {
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
            <FilterWrapper>
                <Bind
                    name={`groups.${groupIndex}.filters.${filterIndex}.id`}
                    defaultValue={filter.id}
                ></Bind>
                <Grid>
                    <Cell span={4}>
                        <Bind
                            name={`groups.${groupIndex}.filters.${filterIndex}.field`}
                            validators={[validation.create("required")]}
                        >
                            <Select label={"Field"} options={getFieldOptions()} />
                        </Bind>
                    </Cell>
                    <Cell span={3}>
                        {filter.field && (
                            <Bind
                                name={`groups.${groupIndex}.filters.${filterIndex}.condition`}
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
                                name={`groups.${groupIndex}.filters.${filterIndex}.value`}
                                field={fields.find(field => field.id === filter.field)}
                            />
                        )}
                    </Cell>
                    <Cell span={1} align={"middle"}>
                        <CellInner align={"center"}>
                            <IconButton icon={<DeleteIcon />} onClick={() => onRemove(filter.id)} />
                        </CellInner>
                    </Cell>
                </Grid>
            </FilterWrapper>
        );
    }
);
