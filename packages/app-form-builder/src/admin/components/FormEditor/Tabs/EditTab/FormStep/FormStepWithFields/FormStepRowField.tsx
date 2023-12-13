import React from "react";
import { FbFormModelField, FbFormStep } from "~/types";
import Draggable, { BeginDragProps } from "~/admin/components/FormEditor/Draggable";
import Field from "../../Field";
import { FieldHandle, FieldContainer } from "../../Styled";

import { Vertical } from "~/admin/components/FormEditor/DropZone";
import { useFormStep } from "~/admin/components/FormEditor/Tabs/EditTab/FormStep/useFormStep";
import { DragObjectWithFieldInfo } from "~/admin/components/FormEditor/Droppable";
import { useFormEditor } from "~/admin/components/FormEditor";

export interface FormStepFieldRowFieldProps {
    formStep: FbFormStep;
    row: FbFormModelField[];
    rowIndex: number;
    field: FbFormModelField;
    fieldIndex: number;
}

export const FormStepRowField = (props: FormStepFieldRowFieldProps) => {
    const { formStep, row, rowIndex, field, fieldIndex } = props;
    const { onFormStepDrop, editField } = useFormStep();
    const { deleteField } = useFormEditor();

    const fieldBeginDragParams: BeginDragProps = {
        ui: "field",
        name: field.name,
        id: field._id,
        pos: {
            row: rowIndex,
            index: fieldIndex
        },
        container: {
            type: "step",
            id: formStep.id
        }
    };

    const onFieldVerticalZoneDrop = (item: DragObjectWithFieldInfo) => {
        onFormStepDrop({
            item,
            formStep,
            destinationPosition: {
                row: rowIndex,
                index: fieldIndex
            }
        });

        return undefined;
    };

    const onLastFieldVerticalZoneDrop = (item: DragObjectWithFieldInfo) => {
        onFormStepDrop({
            item,
            formStep,
            destinationPosition: {
                row: rowIndex,
                index: fieldIndex + 1
            }
        });

        return undefined;
    };

    const isLastField = fieldIndex === row.length - 1;

    return (
        <Draggable key={`step-field-${fieldIndex}`} beginDrag={fieldBeginDragParams}>
            {({ drag }) => (
                <FieldContainer ref={drag}>
                    <Vertical
                        onDrop={onFieldVerticalZoneDrop}
                        isVisible={item =>
                            item.ui === "field" && (row.length < 4 || item?.pos?.row === rowIndex)
                        }
                    />

                    <FieldHandle>
                        <Field
                            field={field}
                            onEdit={editField}
                            onDelete={() => deleteField(field, formStep.id)}
                        />
                    </FieldHandle>

                    {isLastField && (
                        <Vertical
                            last
                            isVisible={item =>
                                item.ui === "field" &&
                                (row.length < 4 || item?.pos?.row === rowIndex)
                            }
                            onDrop={onLastFieldVerticalZoneDrop}
                        />
                    )}
                </FieldContainer>
            )}
        </Draggable>
    );
};
