import React, { useEffect } from "react";

import { observer } from "mobx-react-lite";
import { ReactComponent as DeleteIcon } from "@material-design-icons/svg/outlined/delete_outline.svg";
import { Form, FormAPI, FormOnSubmit } from "@webiny/form";
import { Accordion, AccordionItem } from "@webiny/ui/Accordion";

import { AddOperation } from "~/components/BulkActions/ActionEdit/BatchEditorDialog/AddOperation";
import { Operation } from "~/components/BulkActions/ActionEdit/BatchEditorDialog/Operation";
import {
    BatchEditorDialogViewModel,
    BatchEditorFormData
} from "~/components/BulkActions/ActionEdit/BatchEditorDialog/BatchEditorDialogPresenter";
import { BatchEditorContainer } from "~/components/BulkActions/ActionEdit/ActionEdit.styled";

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
            onSubmit={data => {
                console.log("data", data);
            }}
            invalidFields={props.vm.invalidFields}
        >
            {() => (
                <BatchEditorContainer>
                    <Accordion elevation={1}>
                        {props.vm.data.operations.map((operation, operationIndex) => (
                            <AccordionItem
                                key={`operation-${operationIndex}`}
                                title={operation.title}
                                open={operation.open}
                                actions={
                                    <AccordionItem.Actions>
                                        <AccordionItem.Action
                                            icon={<DeleteIcon />}
                                            onClick={() => props.onDelete(operationIndex)}
                                            disabled={!operation.canDelete}
                                        />
                                    </AccordionItem.Actions>
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
                            </AccordionItem>
                        ))}
                    </Accordion>
                    <AddOperation
                        disabled={!props.vm.canAddOperation}
                        onClick={() => props.onAdd()}
                    />
                </BatchEditorContainer>
            )}
        </Form>
    );
});
