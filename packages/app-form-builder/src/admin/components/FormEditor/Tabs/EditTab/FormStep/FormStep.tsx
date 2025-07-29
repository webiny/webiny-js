import React from "react";

import { FbFormModelField, FbFormStep } from "~/types";
import { Accordion } from "@webiny/admin-ui";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import { ReactComponent as EditIcon } from "@webiny/icons/edit.svg";
import { EmptyFormStep } from "./EmptyFormStep";
import { FormStepWithFields } from "./FormStepWithFields";

import EditFieldDialog from "../EditFieldDialog";
import { useFormStep } from "./useFormStep";

export interface FormStepProps {
    title: string;
    deleteStepDisabled: boolean;
    formStep: FbFormStep;
    onDelete: () => void;
    onEdit: () => void;
    getStepFields: (stepId: string) => FbFormModelField[][];
    updateField: (field: FbFormModelField) => void;
    deleteField: (field: FbFormModelField, stepId: string) => void;
}

export const FormStep = (props: FormStepProps) => {
    const { title, deleteStepDisabled, formStep, onDelete, onEdit, getStepFields, updateField } =
        props;

    const { dropDestination, editingField, editField, createCustomField } = useFormStep();

    const fields = getStepFields(formStep.id);

    return (
        <Accordion data-testid="form-step-element" background={"light"} variant={"container"}>
            <Accordion.Item
                title={title}
                defaultOpen={true}
                draggable={true}
                actions={
                    <>
                        <Accordion.Item.Action icon={<EditIcon />} onClick={onEdit} />
                        <Accordion.Item.Action
                            icon={<DeleteIcon />}
                            onClick={onDelete}
                            disabled={deleteStepDisabled}
                        />
                    </>
                }
            >
                {fields.length === 0 ? (
                    <EmptyFormStep formStep={formStep} />
                ) : (
                    <FormStepWithFields formStep={formStep} fields={fields} />
                )}
                <EditFieldDialog
                    field={editingField}
                    onClose={() => {
                        editField(null);
                    }}
                    onSubmit={initialData => {
                        const data = initialData as FbFormModelField;

                        if (data._id) {
                            updateField(data);
                        } else if (dropDestination) {
                            createCustomField({
                                data,
                                dropDestination
                            });
                        }

                        editField(null);
                    }}
                />
            </Accordion.Item>
        </Accordion>
    );
};
