import React, { useEffect } from "react";

import { observer } from "mobx-react-lite";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete_outline.svg";
import type { FormAPI, FormOnSubmit } from "@webiny/form";
import { Form } from "@webiny/form";

import { AddOperation } from "~/components/BulkActions/ActionEdit/BatchEditorDialog/AddOperation.js";
import { Operation } from "~/components/BulkActions/ActionEdit/BatchEditorDialog/Operation.js";
import type {
    BatchEditorDialogViewModel,
    BatchEditorFormData
} from "~/components/BulkActions/ActionEdit/BatchEditorDialog/BatchEditorDialogPresenter.js";
import { Accordion } from "@webiny/admin-ui";

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
        <div className={"wby-py-lg"}>
            <Form
                ref={formRef}
                data={props.vm.data}
                onChange={props.onChange}
                invalidFields={props.vm.invalidFields}
            >
                {() => (
                    <>
                        <Accordion variant={"container"}>
                            {props.vm.data.operations.map((operation, operationIndex) => (
                                <Accordion.Item
                                    key={`operation-${operationIndex}`}
                                    title={operation.title}
                                    defaultOpen={operation.open}
                                    actions={
                                        <Accordion.Item.Action
                                            icon={<DeleteIcon />}
                                            onClick={() => props.onDelete(operationIndex)}
                                            disabled={!operation.canDelete}
                                        />
                                    }
                                >
                                    <Operation
                                        name={`operations.${operationIndex}`}
                                        operation={operation}
                                        onDelete={() => props.onDelete(operationIndex)}
                                        onSetOperationFieldData={data =>
                                            props.onSetOperationFieldData(operationIndex, data)
                                        }
                                    />
                                </Accordion.Item>
                            ))}
                        </Accordion>
                        <AddOperation
                            disabled={!props.vm.canAddOperation}
                            onClick={() => props.onAdd()}
                        />
                    </>
                )}
            </Form>
        </div>
    );
});
