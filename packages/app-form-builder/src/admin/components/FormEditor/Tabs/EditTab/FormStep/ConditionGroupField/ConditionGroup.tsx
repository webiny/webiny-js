import React from "react";
import { ReactComponent as EditIcon } from "~/admin/icons/edit.svg";
import { ReactComponent as DeleteIcon } from "~/admin/icons/delete.svg";
import { useFormEditor } from "../../../../Context";
import { ContainerType, FbFormModelField, FbFormStep } from "~/types";
import { Accordion } from "@webiny/ui/Accordion";
import { AccordionItem } from "@webiny/ui/Accordion";
import { EmptyConditionGroup } from "./EmptyConditionGroup";
import { ConditionGroupWithFields } from "./ConditionGroupWithFields";

interface DeleteConditionGroupParams {
    formStep: FbFormStep;
    conditionGroup: FbFormModelField;
}

interface OnDeleteParams {
    field: FbFormModelField;
    containerId: string;
    containerType?: ContainerType;
}

interface FieldProps {
    field: FbFormModelField;
    onEdit: (field: FbFormModelField) => void;
    onDelete: (params: OnDeleteParams) => void;
    targetStepId: string;
    formStep: FbFormStep;
    deleteConditionGroup: (params: DeleteConditionGroupParams) => void;
}

const ConditionalGroupField = (props: FieldProps) => {
    const { field: conditionGroupField, onEdit, deleteConditionGroup, formStep } = props;
    const { getField } = useFormEditor();

    const getFields = () => {
        return (conditionGroupField?.settings?.layout || []).map((row: any) => {
            return row
                .map((id: any) => {
                    return getField({
                        _id: id
                    });
                })
                .filter(Boolean) as FbFormModelField[];
        });
    };

    const fields = getFields().map((fields: any) =>
        fields
            .filter((field: any) => field._id !== conditionGroupField._id)
            .filter((field: any) => field.length !== 0)
    ) as FbFormModelField[][];

    return (
        <Accordion>
            <AccordionItem
                title={conditionGroupField.label || ""}
                open={true}
                actions={
                    <AccordionItem.Actions>
                        <AccordionItem.Action
                            icon={<EditIcon />}
                            onClick={() => onEdit(conditionGroupField)}
                        />
                        <AccordionItem.Action
                            icon={<DeleteIcon />}
                            onClick={() => {
                                deleteConditionGroup({
                                    formStep,
                                    conditionGroup: conditionGroupField
                                });
                            }}
                        />
                    </AccordionItem.Actions>
                }
            >
                {fields.length === 0 ? (
                    <EmptyConditionGroup conditionGroupField={conditionGroupField} />
                ) : (
                    <ConditionGroupWithFields
                        fields={fields}
                        conditionGroup={conditionGroupField}
                    />
                )}
            </AccordionItem>
        </Accordion>
    );
};

export default ConditionalGroupField;
