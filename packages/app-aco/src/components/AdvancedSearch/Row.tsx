import React, { useCallback } from "react";
import { ReactComponent as DeleteIcon } from "@material-design-icons/svg/round/delete.svg";
import { Form as DefaultForm } from "@webiny/form";
import { Cell, Grid } from "@webiny/ui/Grid";
import { Select } from "@webiny/ui/Select";
import { validation } from "@webiny/validation";
import { IconButton } from "@webiny/ui/Button";

import { Field, Filter } from "~/components/AdvancedSearch/types";
import { InputField } from "~/components/AdvancedSearch/InputField";

interface RowProps {
    id: string;
    fields: Field[];
    onChange: (id: string, data: any) => void;
    onRemove: (id: string) => void;
}

export const Row: React.VFC<RowProps> = ({ id, fields, onRemove, onChange }) => {
    const getFieldOptions = useCallback(
        () =>
            fields.map(field => ({
                label: field.label,
                value: field.id
            })),
        [fields]
    );

    const getConditionOptions = useCallback((field?: Field) => {
        console.log("field", field);

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
        <DefaultForm<Filter> onChange={data => onChange(id, data)}>
            {({ Bind, data }) => (
                <>
                    <Grid>
                        <Cell span={2}>
                            <Bind name={"operation"} defaultValue={"AND"}>
                                <Select label={"Operation"} options={["AND", "OR"]} />
                            </Bind>
                        </Cell>
                    </Grid>
                    <Grid>
                        <Cell span={4}>
                            <Bind name={"field"} validators={[validation.create("required")]}>
                                <Select label={"Field"} options={getFieldOptions()} />
                            </Bind>
                        </Cell>
                        <Cell span={3}>
                            {data.field && (
                                <Bind
                                    name={"condition"}
                                    validators={[validation.create("required")]}
                                >
                                    <Select
                                        label={"Condition"}
                                        options={getConditionOptions(
                                            fields.find(field => field.id === data.field)
                                        )}
                                    />
                                </Bind>
                            )}
                        </Cell>
                        <Cell span={4}>
                            {data.condition && (
                                <InputField field={fields.find(field => field.id === data.field)} />
                            )}
                        </Cell>
                        <Cell span={1}>
                            <IconButton icon={<DeleteIcon />} onClick={() => onRemove(id)} />
                        </Cell>
                    </Grid>
                </>
            )}
        </DefaultForm>
    );
};
