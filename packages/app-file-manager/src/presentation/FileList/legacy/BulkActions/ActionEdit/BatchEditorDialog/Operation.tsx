import React from "react";

import { observer } from "mobx-react-lite";
import { Grid, Select } from "@webiny/admin-ui";
import { Bind } from "@webiny/form";

import { FieldRenderer } from "~/presentation/FileList/legacy/BulkActions/ActionEdit/BatchEditorDialog/FieldRenderer.js";
import type { OperationFormData } from "~/presentation/FileList/legacy/BulkActions/ActionEdit/BatchEditorDialog/BatchEditorDialogPresenter.js";

export interface OperationProps {
    operation: OperationFormData;
    name: string;
    onDelete: () => void;
    onSetOperationFieldData: (data: string) => void;
}

export const Operation = observer((props: OperationProps) => {
    return (
        <Grid>
            <Grid.Column span={6}>
                <Bind name={`${props.name}.field`}>
                    {({ value, validation }) => (
                        <Select
                            label={"Field"}
                            options={props.operation.fieldOptions}
                            value={value}
                            onChange={data => props.onSetOperationFieldData(data)}
                            validation={validation}
                        />
                    )}
                </Bind>
            </Grid.Column>
            <Grid.Column span={6}>
                {props.operation.field && (
                    <Bind name={`${props.name}.operator`}>
                        {({ value, onChange, validation }) => (
                            <Select
                                label={"Operation"}
                                options={props.operation.operatorOptions}
                                value={value}
                                onChange={onChange}
                                validation={validation}
                            />
                        )}
                    </Bind>
                )}
            </Grid.Column>
            <>
                {props.operation.selectedField ? (
                    <FieldRenderer
                        operator={props.operation.operator}
                        field={props.operation.selectedField}
                        name={`${props.name}.value`}
                    />
                ) : null}
            </>
        </Grid>
    );
});
