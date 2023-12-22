import React from "react";

import { FbFormModelField, FbFormStep } from "~/types";
import { RowHandle, StyledAccordion, StyledAccordionItem, Wrapper, RulesTag } from "../Styled";

import { Icon } from "@webiny/ui/Icon";
import { AccordionItem } from "@webiny/ui/Accordion";
import { ReactComponent as DeleteIcon } from "@material-design-icons/svg/outlined/delete_outline.svg";
import { ReactComponent as EditIcon } from "@material-design-icons/svg/outlined/edit.svg";
import { ReactComponent as HandleIcon } from "~/admin/components/FormEditor/icons/round-drag_indicator-24px.svg";
import { EmptyFormStep } from "./EmptyFormStep";
import { FormStepWithFields } from "./FormStepWithFields";

import EditFieldDialog from "../EditFieldDialog";
import { useFormStep } from "./useFormStep";
import { DeleteFieldParams } from "../../../Context/useFormEditorFactory";

export interface FormStepProps {
    title: string;
    deleteStepDisabled: boolean;
    formStep: FbFormStep;
    onDelete: () => void;
    onEdit: () => void;
    getStepFields: (stepId: string) => FbFormModelField[][];
    updateField: (field: FbFormModelField) => void;
    deleteField: (params: DeleteFieldParams) => void;
}

export const FormStep = (props: FormStepProps) => {
    const { title, deleteStepDisabled, formStep, onDelete, onEdit, getStepFields, updateField } =
        props;

    const { dropDestination, editingField, editField, createCustomField } = useFormStep();

    const fields = getStepFields(formStep.id);

    return (
        <Wrapper data-testid="form-step-element">
            <StyledAccordion>
                <RowHandle>
                    <Icon icon={<HandleIcon />} />
                </RowHandle>
                <StyledAccordionItem
                    title={title}
                    open={true}
                    actions={
                        <AccordionItem.Actions>
                            {formStep.rules.length ? (
                                <RulesTag isValid={true}>{"Rules Attached"}</RulesTag>
                            ) : (
                                <></>
                            )}
                            <AccordionItem.Action icon={<EditIcon />} onClick={onEdit} />
                            <AccordionItem.Action
                                icon={<DeleteIcon />}
                                onClick={onDelete}
                                disabled={deleteStepDisabled}
                            />
                        </AccordionItem.Actions>
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
                </StyledAccordionItem>
            </StyledAccordion>
        </Wrapper>
    );
};
