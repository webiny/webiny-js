import React, { useCallback, useMemo } from "react";
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

export const FormStepRowField: React.FC<FormStepFieldRowFieldProps> = props => {
    const { formStep, row, rowIndex, field, fieldIndex } = props;
    const { onFormStepDrop, editField } = useFormStep();
    const { deleteField } = useFormEditor();

    const fieldBeginDragParams = useMemo<BeginDragProps>(() => {
        return {
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
    }, [field, rowIndex, fieldIndex, formStep]);

    const onFieldVerticalZoneDrop = useCallback(
        (item: DragObjectWithFieldInfo) =>
            onFormStepDrop({
                item,
                destinationPosition: {
                    row: rowIndex,
                    index: fieldIndex
                },
                formStep
            }),
        [rowIndex, fieldIndex, formStep]
    );

    const onLastFieldVerticalZoneDrop = useCallback(
        (item: DragObjectWithFieldInfo) =>
            onFormStepDrop({
                item,
                destinationPosition: {
                    row: rowIndex,
                    index: fieldIndex + 1
                },
                formStep
            }),
        []
    );

    const isLastField = fieldIndex === row.length - 1;

    return (
        <Draggable key={`field-${fieldIndex}`} beginDrag={fieldBeginDragParams}>
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
