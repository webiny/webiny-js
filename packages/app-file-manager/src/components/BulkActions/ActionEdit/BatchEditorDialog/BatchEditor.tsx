import React, { useEffect } from "react";
import { observer } from "mobx-react-lite";

import { AddOperation } from "~/components/BulkActions/ActionEdit/BatchEditorDialog/AddOperation";
import { ReactComponent as DeleteIcon } from "@material-design-icons/svg/outlined/delete_outline.svg";

import { Operation } from "~/components/BulkActions/ActionEdit/BatchEditorDialog/Operation";
import { Form, FormAPI, FormOnSubmit } from "@webiny/form";
import {
    BatchEditorDialogViewModel,
    BatchEditorFormData
} from "~/components/BulkActions/ActionEdit/BatchEditorDialog/BatchEditorDialogPresenter";
import { Accordion, AccordionItem } from "@webiny/ui/Accordion";
import {
    AccordionItemInner,
    BatchEditorContainer
} from "~/components/BulkActions/ActionEdit/ActionEdit.styled";
import { FilterOperationContainer } from "@webiny/app-aco/components/AdvancedSearch/QueryBuilderDrawer/QueryBuilder/Querybuilder.styled";
import { OperationSelector } from "@webiny/app-aco/components/AdvancedSearch/QueryBuilderDrawer/QueryBuilder/components";

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
        >
            {() => (
                <BatchEditorContainer>
                    <Accordion elevation={1}>
                        {props.vm.data.operations.map((operation, operationIndex) => (
                            <AccordionItem
                                key={`group-${operationIndex}`}
                                title={"title"}
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
                                    key={`operation-${operationIndex}`}
                                    name={`operations.${operationIndex}`}
                                    operation={operation}
                                    fields={props.vm.fields}
                                    onSetOperationFieldData={data =>
                                        props.onSetOperationFieldData(operationIndex, data)
                                    }
                                />
                            </AccordionItem>
                        ))}
                    </Accordion>
                    <AddOperation onClick={() => props.onAdd()} />
                </BatchEditorContainer>
            )}
        </Form>
    );
});
