import React, { useEffect } from "react";

import { observer } from "mobx-react-lite";
import { Form, FormAPI, FormOnSubmit } from "@webiny/form";

import { AddOperation } from "~/components/BulkActions/ActionEdit/BatchEditorDialog/AddOperation";
import { Operation } from "~/components/BulkActions/ActionEdit/BatchEditorDialog/Operation";
import {
    BatchEditorDialogViewModel,
    BatchEditorFormData
} from "~/components/BulkActions/ActionEdit/BatchEditorDialog/BatchEditorDialogPresenter";

export interface BatchEditorProps {
    onForm: (form: FormAPI) => void;
    onAdd: () => void;
    onDelete: (operationIndex: number) => void;
    onChange: (data: BatchEditorFormData) => void;
    onSetOperationFieldData: (operationIndex: number, data: string) => void;
    onSubmit: FormOnSubmit<BatchEditorFormData>;
    vm: BatchEditorDialogViewModel;
}

export const BatchEditor = observer((props: BatchEditorProps) => {
    const formRef = React.createRef<FormAPI>();

    useEffect(() => {
        if (formRef.current) {
            props.onForm(formRef.current);
        }
    }, []);

    return (
        <Form
            ref={formRef}
            data={props.vm.data}
            onChange={props.onChange}
            onSubmit={props.onSubmit}
            invalidFields={props.vm.invalidFields}
        >
            {() => (
                <>
                    {props.vm.data.operations.map((operation, operationIndex) => (
                        <Operation
                            key={`operation-${operationIndex}`}
                            name={`operations.${operationIndex}`}
                            operation={operation}
                            fields={props.vm.fields}
                            onDelete={() => props.onDelete(operationIndex)}
                            onSetOperationFieldData={data =>
                                props.onSetOperationFieldData(operationIndex, data)
                            }
                        />
                    ))}
                    <AddOperation onClick={() => props.onAdd()} />
                </>
            )}
        </Form>
    );
});
