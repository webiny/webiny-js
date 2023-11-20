import React from "react";

import { observer } from "mobx-react-lite";

import { Bind } from "@webiny/form";
import { Cell, Grid } from "@webiny/ui/Grid";
import { Select } from "@webiny/ui/Select";

import { FieldDTO, OperationDTO } from "~/components/BulkActions/ActionEdit/domain";
import { FieldRenderer } from "~/components/BulkActions/ActionEdit/BatchEditorDialog/FieldRenderer";

export interface OperationProps {
    fields: FieldDTO[];
    operation: OperationDTO & { canDelete: boolean };
    name: string;
    onSetOperationFieldData: (data: string) => void;
}

export const Operation = observer((props: OperationProps) => {
    return (
        <Grid>
            <Cell span={6}>
                <Bind name={`${props.name}.field`}>
                    {({ value, validation }) => (
                        <Select
                            label={"Field"}
                            options={props.fields}
                            value={value}
                            onChange={data => props.onSetOperationFieldData(data)}
                            validation={validation}
                        />
                    )}
                </Bind>
            </Cell>
            <Cell span={6}>
                {props.operation.field && (
                    <Bind name={`${props.name}.operator`}>
                        {({ value, onChange, validation }) => (
                            <Select
                                label={"Operation"}
                                options={
                                    props.fields.find(
                                        field => field.value === props.operation.field
                                    )?.operators || []
                                }
                                value={value}
                                onChange={onChange}
                                validation={validation}
                            />
                        )}
                    </Bind>
                )}
            </Cell>
            <Cell span={12}>
                <FieldRenderer
                    operator={props.operation.operator}
                    field={props.fields.find(field => field.value === props.operation.field)}
                    name={`${props.name}.value`}
                />
            </Cell>
        </Grid>
    );
});
