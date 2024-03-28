import React from "react";
import { ReactComponent as EditIcon } from "~/admin/icons/edit.svg";
import { ReactComponent as DeleteIcon } from "~/admin/icons/delete.svg";
import { useFormEditor } from "../../../../Context";
import { ContainerType, FbFormModelField, FbFormStep } from "~/types";
import { Accordion } from "@webiny/ui/Accordion";
import { AccordionItem } from "@webiny/ui/Accordion";
import { RulesTag } from "../../Styled";
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
        return (conditionGroupField?.settings?.layout || []).map((row: string[]) => {
            return row
                .map((id: string) => {
                    return getField({
                        _id: id
                    });
                })
                .filter(Boolean) as FbFormModelField[];
        });
    };

    const fields = getFields().map((fields: FbFormModelField[]) =>
        fields.filter((field: FbFormModelField) => field._id !== conditionGroupField._id)
    ) as FbFormModelField[][];

    return (
        <Accordion>
            <AccordionItem
                title={conditionGroupField.label || ""}
                open={true}
                actions={
                    <AccordionItem.Actions>
                        {conditionGroupField.settings.rules?.length ? (
                            <RulesTag isValid={true}>{"Rules Attached"}</RulesTag>
                        ) : (
                            <></>
                        )}
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
