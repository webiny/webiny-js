import React from "react";

import { observer } from "mobx-react-lite";

import { Bind } from "@webiny/form";
import { Cell, Grid } from "@webiny/ui/Grid";
import { Select } from "@webiny/ui/Select";

import { FieldDTO, OperationDTO } from "~/components/BulkActions/ActionEdit/domain";
import { RemoveOperation } from "~/components/BulkActions/ActionEdit/BatchEditorDialog/RemoveOperation";
import { FieldRenderer } from "~/components/BulkActions/ActionEdit/BatchEditorDialog/FieldRenderer";

export interface OperationProps {
    operation: OperationDTO & { canDelete: boolean; availableFields: FieldDTO[] };
    name: string;
    onDelete: () => void;
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
                            options={props.operation.availableFields}
                            value={value}
                            onChange={data => props.onSetOperationFieldData(data)}
                            validation={validation}
                        />
                    )}
                </Bind>
            </Cell>
            <Cell span={5}>
                {props.operation.field && (
                    <Bind name={`${props.name}.operator`}>
                        {({ value, onChange, validation }) => (
                            <Select
                                label={"Operation"}
                                options={
                                    props.operation.availableFields.find(
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
            <Cell span={1} align={"middle"}>
                <RemoveOperation onClick={props.onDelete} disabled={!props.operation.canDelete} />
            </Cell>
            <Cell span={11}>
                <FieldRenderer
                    operator={props.operation.operator}
                    field={props.operation.availableFields.find(
                        field => field.value === props.operation.field
                    )}
                    name={`${props.name}.value`}
                />
            </Cell>
        </Grid>
    );
});
